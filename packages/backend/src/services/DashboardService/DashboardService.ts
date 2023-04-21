import { subject } from '@casl/ability';
import {
    CreateDashboard,
    CreateSchedulerAndTargetsWithoutIds,
    Dashboard,
    DashboardBasicDetails,
    DashboardTileTypes,
    ForbiddenError,
    isChartScheduler,
    isDashboardUnversionedFields,
    isDashboardVersionedFields,
    isSlackTarget,
    isUserWithOrg,
    SchedulerAndTargets,
    SessionUser,
    Space,
    UpdateDashboard,
    UpdateMultipleDashboards,
} from '@lightdash/common';
import * as Sentry from '@sentry/node';
import cronstrue from 'cronstrue';
import { analytics } from '../../analytics/client';
import { CreateDashboardOrVersionEvent } from '../../analytics/LightdashAnalytics';
import { schedulerClient, slackClient } from '../../clients/clients';
import database from '../../database/database';
import { getFirstAccessibleSpace } from '../../database/entities/spaces';
import { AnalyticsModel } from '../../models/AnalyticsModel';
import { DashboardModel } from '../../models/DashboardModel/DashboardModel';
import { PinnedListModel } from '../../models/PinnedListModel';
import { SchedulerModel } from '../../models/SchedulerModel';
import { SpaceModel } from '../../models/SpaceModel';
import { hasSpaceAccess } from '../SpaceService/SpaceService';

type Dependencies = {
    dashboardModel: DashboardModel;
    spaceModel: SpaceModel;
    analyticsModel: AnalyticsModel;
    pinnedListModel: PinnedListModel;
    schedulerModel: SchedulerModel;
};

export class DashboardService {
    dashboardModel: DashboardModel;

    spaceModel: SpaceModel;

    analyticsModel: AnalyticsModel;

    pinnedListModel: PinnedListModel;

    schedulerModel: SchedulerModel;

    constructor({
        dashboardModel,
        spaceModel,
        analyticsModel,
        pinnedListModel,
        schedulerModel,
    }: Dependencies) {
        this.dashboardModel = dashboardModel;
        this.spaceModel = spaceModel;
        this.analyticsModel = analyticsModel;
        this.pinnedListModel = pinnedListModel;
        this.schedulerModel = schedulerModel;
    }

    private async checkUpdateAccess(
        user: SessionUser,
        dashboardUuid: string,
    ): Promise<Dashboard> {
        const dashboard = await this.dashboardModel.getById(dashboardUuid);
        const { organizationUuid, projectUuid } = dashboard;
        if (
            user.ability.cannot(
                'update',
                subject('Dashboard', { organizationUuid, projectUuid }),
            )
        ) {
            throw new ForbiddenError();
        }
        return dashboard;
    }

    async hasDashboardSpaceAccess(
        spaceUuid: string,
        userUuid: string,
    ): Promise<boolean> {
        let space: Space;

        try {
            space = await this.spaceModel.getFullSpace(spaceUuid);
        } catch (e) {
            Sentry.captureException(e);
            console.error(e);
            return false;
        }

        return hasSpaceAccess(space, userUuid);
    }

    static getCreateEventProperties(
        dashboard: Dashboard,
    ): CreateDashboardOrVersionEvent['properties'] {
        return {
            projectId: dashboard.projectUuid,
            dashboardId: dashboard.uuid,
            filtersCount: dashboard.filters
                ? dashboard.filters.metrics.length +
                  dashboard.filters.dimensions.length
                : 0,
            tilesCount: dashboard.tiles.length,
            chartTilesCount: dashboard.tiles.filter(
                ({ type }) => type === DashboardTileTypes.SAVED_CHART,
            ).length,
            markdownTilesCount: dashboard.tiles.filter(
                ({ type }) => type === DashboardTileTypes.MARKDOWN,
            ).length,
            loomTilesCount: dashboard.tiles.filter(
                ({ type }) => type === DashboardTileTypes.LOOM,
            ).length,
        };
    }

    async getAllByProject(
        user: SessionUser,
        projectUuid: string,
        chartUuid?: string,
    ): Promise<DashboardBasicDetails[]> {
        const dashboards = await this.dashboardModel.getAllByProject(
            projectUuid,
            chartUuid,
        );

        const spaceUuids = [
            ...new Set(dashboards.map((dashboard) => dashboard.spaceUuid)),
        ];
        const spaces = await Promise.all(
            spaceUuids.map((spaceUuid) =>
                this.spaceModel.getFullSpace(spaceUuid),
            ),
        );
        return dashboards.filter((dashboard) => {
            const hasAbility = user.ability.can(
                'view',
                subject('Dashboard', dashboard),
            );
            const dashboardSpace = spaces.find(
                (space) => space.uuid === dashboard.spaceUuid,
            );
            return (
                hasAbility &&
                dashboardSpace &&
                hasSpaceAccess(dashboardSpace, user.userUuid)
            );
        });
    }

    async getById(
        user: SessionUser,
        dashboardUuid: string,
    ): Promise<Dashboard> {
        const dashboard = await this.dashboardModel.getById(dashboardUuid);
        if (user.ability.cannot('view', subject('Dashboard', dashboard))) {
            throw new ForbiddenError();
        }
        if (
            !(await this.hasDashboardSpaceAccess(
                dashboard.spaceUuid,
                user.userUuid,
            ))
        ) {
            throw new ForbiddenError(
                "You don't have access to the space this dashboard belongs to",
            );
        }

        await this.analyticsModel.addDashboardViewEvent(
            dashboard.uuid,
            user.userUuid,
        );
        analytics.track({
            event: 'dashboard.view',
            userId: user.userUuid,
            properties: {
                dashboardId: dashboard.uuid,
                organizationId: dashboard.organizationUuid,
                projectId: dashboard.projectUuid,
            },
        });

        return dashboard;
    }

    async create(
        user: SessionUser,
        projectUuid: string,
        dashboard: CreateDashboard,
    ): Promise<Dashboard> {
        const getFirstSpace = async () => {
            const space = await getFirstAccessibleSpace(
                database,
                projectUuid,
                user.userUuid,
            );
            return {
                organizationUuid: space.organization_uuid,
                uuid: space.space_uuid,
            };
        };
        const space = dashboard.spaceUuid
            ? await this.spaceModel.get(dashboard.spaceUuid)
            : await getFirstSpace();

        if (
            user.ability.cannot(
                'create',
                subject('Dashboard', {
                    organizationUuid: space.organizationUuid,
                    projectUuid,
                }),
            )
        ) {
            throw new ForbiddenError();
        }
        if (!(await this.hasDashboardSpaceAccess(space.uuid, user.userUuid))) {
            throw new ForbiddenError(
                "You don't have access to the space this dashboard belongs to",
            );
        }
        const newDashboard = await this.dashboardModel.create(
            space.uuid,
            dashboard,
            user,
        );
        analytics.track({
            event: 'dashboard.created',
            userId: user.userUuid,
            properties: DashboardService.getCreateEventProperties(newDashboard),
        });
        return this.dashboardModel.getById(newDashboard.uuid);
    }

    async duplicate(
        user: SessionUser,
        projectUuid: string,
        dashboardUuid: string,
    ): Promise<Dashboard> {
        const dashboard = await this.dashboardModel.getById(dashboardUuid);

        if (user.ability.cannot('create', subject('Dashboard', dashboard))) {
            throw new ForbiddenError();
        }

        if (
            !(await this.hasDashboardSpaceAccess(
                dashboard.spaceUuid,
                user.userUuid,
            ))
        ) {
            throw new ForbiddenError(
                "You don't have access to the space this dashboard belongs to",
            );
        }

        const duplicatedDashboard = {
            ...dashboard,
            name: `Copy of ${dashboard.name}`,
        };
        const newDashboard = await this.dashboardModel.create(
            dashboard.spaceUuid,
            duplicatedDashboard,
            user,
        );

        const dashboardProperties =
            DashboardService.getCreateEventProperties(newDashboard);
        analytics.track({
            event: 'dashboard.created',
            userId: user.userUuid,
            properties: { ...dashboardProperties, duplicated: true },
        });

        analytics.track({
            event: 'duplicated_dashboard_created',
            userId: user.userUuid,
            properties: {
                ...dashboardProperties,
                newDashboardId: newDashboard.uuid,
                duplicateOfDashboardId: dashboard.uuid,
            },
        });

        return this.dashboardModel.getById(newDashboard.uuid);
    }

    async update(
        user: SessionUser,
        dashboardUuid: string,
        dashboard: UpdateDashboard,
    ): Promise<Dashboard> {
        const existingDashboard = await this.dashboardModel.getById(
            dashboardUuid,
        );
        if (
            user.ability.cannot(
                'update',
                subject('Dashboard', existingDashboard),
            )
        ) {
            throw new ForbiddenError();
        }

        if (
            !(await this.hasDashboardSpaceAccess(
                existingDashboard.spaceUuid,
                user.userUuid,
            ))
        ) {
            throw new ForbiddenError(
                "You don't have access to the space this dashboard belongs to",
            );
        }

        if (isDashboardUnversionedFields(dashboard)) {
            const updatedDashboard = await this.dashboardModel.update(
                dashboardUuid,
                {
                    name: dashboard.name,
                    description: dashboard.description,
                    spaceUuid: dashboard.spaceUuid,
                },
            );

            analytics.track({
                event: 'dashboard.updated',
                userId: user.userUuid,
                properties: {
                    dashboardId: updatedDashboard.uuid,
                    projectId: updatedDashboard.projectUuid,
                },
            });
        }
        if (isDashboardVersionedFields(dashboard)) {
            const updatedDashboard = await this.dashboardModel.addVersion(
                dashboardUuid,
                {
                    tiles: dashboard.tiles,
                    filters: dashboard.filters,
                },
                user,
            );
            analytics.track({
                event: 'dashboard_version.created',
                userId: user.userUuid,
                properties:
                    DashboardService.getCreateEventProperties(updatedDashboard),
            });
        }
        return this.dashboardModel.getById(dashboardUuid);
    }

    async togglePinning(
        user: SessionUser,
        dashboardUuid: string,
    ): Promise<Dashboard> {
        const existingDashboard = await this.dashboardModel.getById(
            dashboardUuid,
        );
        const { projectUuid, organizationUuid, pinnedListUuid, spaceUuid } =
            existingDashboard;
        if (
            user.ability.cannot(
                'update',
                subject('Project', { projectUuid, organizationUuid }),
            )
        ) {
            throw new ForbiddenError();
        }

        if (!(await this.hasDashboardSpaceAccess(spaceUuid, user.userUuid))) {
            throw new ForbiddenError(
                "You don't have access to the space this dashboard belongs to",
            );
        }
        if (pinnedListUuid) {
            await this.pinnedListModel.deleteItem({
                pinnedListUuid,
                dashboardUuid,
            });
        } else {
            await this.pinnedListModel.addItem({
                projectUuid,
                dashboardUuid,
            });
        }

        const pinnedList = await this.pinnedListModel.getPinnedListAndItems(
            existingDashboard.projectUuid,
        );

        analytics.track({
            event: 'pinned_list.updated',
            userId: user.userUuid,
            properties: {
                projectId: existingDashboard.projectUuid,
                organizationId: existingDashboard.organizationUuid,
                location: 'homepage',
                pinnedListId: pinnedList.pinnedListUuid,
                pinnedItems: pinnedList.items,
            },
        });

        return this.getById(user, dashboardUuid);
    }

    async updateMultiple(
        user: SessionUser,
        projectUuid: string,
        dashboards: UpdateMultipleDashboards[],
    ): Promise<Dashboard[]> {
        const space = await getFirstAccessibleSpace(
            database,
            projectUuid,
            user.userUuid,
        );

        if (
            user.ability.cannot(
                'update',
                subject('Dashboard', {
                    organizationUuid: space.organization_uuid,
                    projectUuid,
                }),
            )
        ) {
            throw new ForbiddenError();
        }

        if (
            !(await this.hasDashboardSpaceAccess(
                space.space_uuid,
                user.userUuid,
            ))
        ) {
            throw new ForbiddenError(
                "You don't have access to the space this dashboard belongs to",
            );
        }

        analytics.track({
            event: 'dashboard.updated_multiple',
            userId: user.userUuid,
            properties: {
                dashboardIds: dashboards.map((dashboard) => dashboard.uuid),
                projectId: projectUuid,
            },
        });
        return this.dashboardModel.updateMultiple(projectUuid, dashboards);
    }

    async delete(user: SessionUser, dashboardUuid: string): Promise<void> {
        const { organizationUuid, projectUuid, spaceUuid } =
            await this.dashboardModel.getById(dashboardUuid);
        if (
            user.ability.cannot(
                'delete',
                subject('Dashboard', { organizationUuid, projectUuid }),
            )
        ) {
            throw new ForbiddenError();
        }

        if (!(await this.hasDashboardSpaceAccess(spaceUuid, user.userUuid))) {
            throw new ForbiddenError(
                "You don't have access to the space this dashboard belongs to",
            );
        }
        const deletedDashboard = await this.dashboardModel.delete(
            dashboardUuid,
        );
        analytics.track({
            event: 'dashboard.deleted',
            userId: user.userUuid,
            properties: {
                dashboardId: deletedDashboard.uuid,
                projectId: deletedDashboard.projectUuid,
            },
        });
    }

    async getSchedulers(
        user: SessionUser,
        dashboardUuid: string,
    ): Promise<SchedulerAndTargets[]> {
        await this.checkUpdateAccess(user, dashboardUuid);
        return this.schedulerModel.getDashboardSchedulers(dashboardUuid);
    }

    async createScheduler(
        user: SessionUser,
        dashboardUuid: string,
        newScheduler: CreateSchedulerAndTargetsWithoutIds,
    ): Promise<SchedulerAndTargets> {
        if (!isUserWithOrg(user)) {
            throw new ForbiddenError('User is not part of an organization');
        }
        const { projectUuid, organizationUuid } = await this.checkUpdateAccess(
            user,
            dashboardUuid,
        );
        const scheduler = await this.schedulerModel.createScheduler({
            ...newScheduler,
            createdBy: user.userUuid,
            dashboardUuid,
            savedChartUuid: null,
        });
        analytics.track({
            userId: user.userUuid,
            event: 'scheduler.created',
            properties: {
                projectId: projectUuid,
                organizationId: organizationUuid,
                schedulerId: scheduler.schedulerUuid,
                resourceType: isChartScheduler(scheduler)
                    ? 'chart'
                    : 'dashboard',
                cronExpression: scheduler.cron,
                cronString: cronstrue.toString(scheduler.cron, {
                    verbose: true,
                    throwExceptionOnParseError: false,
                }),
                resourceId: isChartScheduler(scheduler)
                    ? scheduler.savedChartUuid
                    : scheduler.dashboardUuid,
                targets: scheduler.targets.map((target) =>
                    isSlackTarget(target)
                        ? {
                              schedulerTargetId:
                                  target.schedulerSlackTargetUuid,
                              type: 'slack',
                          }
                        : {
                              schedulerTargetId:
                                  target.schedulerEmailTargetUuid,
                              type: 'email',
                          },
                ),
            },
        });

        await slackClient.joinChannels(
            user.organizationUuid,
            SchedulerModel.getSlackChannels(scheduler.targets),
        );
        await schedulerClient.generateDailyJobsForScheduler(scheduler);
        return scheduler;
    }
}
