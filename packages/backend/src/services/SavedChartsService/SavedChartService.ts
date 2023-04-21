import { subject } from '@casl/ability';
import {
    ChartType,
    countTotalFilterRules,
    CreateSavedChart,
    CreateSavedChartVersion,
    CreateSchedulerAndTargetsWithoutIds,
    ForbiddenError,
    isChartScheduler,
    isSlackTarget,
    isUserWithOrg,
    SavedChart,
    SchedulerAndTargets,
    SessionUser,
    UpdateMultipleSavedChart,
    UpdateSavedChart,
} from '@lightdash/common';
import cronstrue from 'cronstrue';
import { analytics } from '../../analytics/client';
import { CreateSavedChartOrVersionEvent } from '../../analytics/LightdashAnalytics';
import { schedulerClient, slackClient } from '../../clients/clients';
import { AnalyticsModel } from '../../models/AnalyticsModel';
import { PinnedListModel } from '../../models/PinnedListModel';
import { ProjectModel } from '../../models/ProjectModel/ProjectModel';
import { SavedChartModel } from '../../models/SavedChartModel';
import { SchedulerModel } from '../../models/SchedulerModel';
import { SpaceModel } from '../../models/SpaceModel';
import { hasSpaceAccess } from '../SpaceService/SpaceService';

type Dependencies = {
    projectModel: ProjectModel;
    savedChartModel: SavedChartModel;
    spaceModel: SpaceModel;
    analyticsModel: AnalyticsModel;
    pinnedListModel: PinnedListModel;
    schedulerModel: SchedulerModel;
};

export class SavedChartService {
    private readonly projectModel: ProjectModel;

    private readonly savedChartModel: SavedChartModel;

    private readonly spaceModel: SpaceModel;

    private readonly analyticsModel: AnalyticsModel;

    private readonly pinnedListModel: PinnedListModel;

    private readonly schedulerModel: SchedulerModel;

    constructor(dependencies: Dependencies) {
        this.projectModel = dependencies.projectModel;
        this.savedChartModel = dependencies.savedChartModel;
        this.spaceModel = dependencies.spaceModel;
        this.analyticsModel = dependencies.analyticsModel;
        this.pinnedListModel = dependencies.pinnedListModel;
        this.schedulerModel = dependencies.schedulerModel;
    }

    private async checkUpdateAccess(
        user: SessionUser,
        chartUuid: string,
    ): Promise<SavedChart> {
        const savedChart = await this.savedChartModel.get(chartUuid);
        const { organizationUuid, projectUuid } = savedChart;
        if (
            user.ability.cannot(
                'update',
                subject('SavedChart', { organizationUuid, projectUuid }),
            )
        ) {
            throw new ForbiddenError();
        }
        return savedChart;
    }

    async hasChartSpaceAccess(
        spaceUuid: string,
        userUuid: string,
    ): Promise<boolean> {
        try {
            const space = await this.spaceModel.getFullSpace(spaceUuid);
            return hasSpaceAccess(space, userUuid);
        } catch (e) {
            return false;
        }
    }

    static getCreateEventProperties(
        savedChart: SavedChart,
    ): CreateSavedChartOrVersionEvent['properties'] {
        const echartsConfig =
            savedChart.chartConfig.type === ChartType.CARTESIAN
                ? savedChart.chartConfig.config.eChartsConfig
                : undefined;
        const tableConfig =
            savedChart.chartConfig.type === ChartType.TABLE
                ? savedChart.chartConfig.config
                : undefined;

        return {
            projectId: savedChart.projectUuid,
            savedQueryId: savedChart.uuid,
            dimensionsCount: savedChart.metricQuery.dimensions.length,
            metricsCount: savedChart.metricQuery.metrics.length,
            filtersCount: countTotalFilterRules(savedChart.metricQuery.filters),
            sortsCount: savedChart.metricQuery.sorts.length,
            tableCalculationsCount:
                savedChart.metricQuery.tableCalculations.length,
            pivotCount: (savedChart.pivotConfig?.columns || []).length,
            chartType: savedChart.chartConfig.type,
            table:
                savedChart.chartConfig.type === ChartType.TABLE
                    ? {
                          conditionalFormattingRulesCount:
                              tableConfig?.conditionalFormattings?.length || 0,
                      }
                    : undefined,
            cartesian:
                savedChart.chartConfig.type === ChartType.CARTESIAN
                    ? {
                          xAxisCount: (
                              savedChart.chartConfig.config.eChartsConfig
                                  .xAxis || []
                          ).length,
                          yAxisCount: (
                              savedChart.chartConfig.config.eChartsConfig
                                  .yAxis || []
                          ).length,
                          seriesTypes: (
                              savedChart.chartConfig.config.eChartsConfig
                                  .series || []
                          ).map(({ type }) => type),
                          seriesCount: (
                              savedChart.chartConfig.config.eChartsConfig
                                  .series || []
                          ).length,
                          referenceLinesCount:
                              echartsConfig?.series?.filter(
                                  (serie) => serie.markLine?.data !== undefined,
                              ).length || 0,
                          margins:
                              echartsConfig?.grid?.top === undefined
                                  ? 'default'
                                  : 'custom',
                          showLegend: echartsConfig?.legend?.show !== false,
                      }
                    : undefined,
        };
    }

    async createVersion(
        user: SessionUser,
        savedChartUuid: string,
        data: CreateSavedChartVersion,
    ): Promise<SavedChart> {
        const { organizationUuid, projectUuid } =
            await this.savedChartModel.get(savedChartUuid);

        if (
            user.ability.cannot(
                'update',
                subject('SavedChart', { organizationUuid, projectUuid }),
            )
        ) {
            throw new ForbiddenError();
        }
        const savedChart = await this.savedChartModel.createVersion(
            savedChartUuid,
            data,
            user,
        );

        analytics.track({
            event: 'saved_chart_version.created',
            userId: user.userUuid,
            properties: SavedChartService.getCreateEventProperties(savedChart),
        });
        return savedChart;
    }

    async update(
        user: SessionUser,
        savedChartUuid: string,
        data: UpdateSavedChart,
    ): Promise<SavedChart> {
        const { organizationUuid, projectUuid } =
            await this.savedChartModel.get(savedChartUuid);

        if (
            user.ability.cannot(
                'update',
                subject('SavedChart', { organizationUuid, projectUuid }),
            )
        ) {
            throw new ForbiddenError();
        }
        const savedChart = await this.savedChartModel.update(
            savedChartUuid,
            data,
        );
        analytics.track({
            event: 'saved_chart.updated',
            userId: user.userUuid,
            properties: {
                projectId: savedChart.projectUuid,
                savedQueryId: savedChartUuid,
            },
        });
        return savedChart;
    }

    async togglePinning(
        user: SessionUser,
        savedChartUuid: string,
    ): Promise<SavedChart> {
        const { organizationUuid, projectUuid, pinnedListUuid } =
            await this.savedChartModel.get(savedChartUuid);

        if (
            user.ability.cannot(
                'update',
                subject('Project', { organizationUuid, projectUuid }),
            )
        ) {
            throw new ForbiddenError();
        }
        if (pinnedListUuid) {
            await this.pinnedListModel.deleteItem({
                pinnedListUuid,
                savedChartUuid,
            });
        } else {
            await this.pinnedListModel.addItem({
                projectUuid,
                savedChartUuid,
            });
        }

        const pinnedList = await this.pinnedListModel.getPinnedListAndItems(
            projectUuid,
        );

        analytics.track({
            event: 'pinned_list.updated',
            userId: user.userUuid,
            properties: {
                projectId: projectUuid,
                organizationId: organizationUuid,
                location: 'homepage',
                pinnedListId: pinnedList.pinnedListUuid,
                pinnedItems: pinnedList.items,
            },
        });

        return this.get(savedChartUuid, user);
    }

    async updateMultiple(
        user: SessionUser,
        projectUuid: string,
        data: UpdateMultipleSavedChart[],
    ): Promise<SavedChart[]> {
        const project = await this.projectModel.get(projectUuid);

        if (
            user.ability.cannot(
                'update',
                subject('SavedChart', {
                    organizationUuid: project.organizationUuid,
                    projectUuid,
                }),
            )
        ) {
            throw new ForbiddenError();
        }
        const savedCharts = await this.savedChartModel.updateMultiple(data);
        analytics.track({
            event: 'saved_chart.updated_multiple',
            userId: user.userUuid,
            properties: {
                savedChartIds: data.map((chart) => chart.uuid),
                projectId: projectUuid,
            },
        });
        return savedCharts;
    }

    async delete(user: SessionUser, savedChartUuid: string): Promise<void> {
        const { organizationUuid, projectUuid } =
            await this.savedChartModel.get(savedChartUuid);

        if (
            user.ability.cannot(
                'delete',
                subject('SavedChart', { organizationUuid, projectUuid }),
            )
        ) {
            throw new ForbiddenError();
        }
        const deletedChart = await this.savedChartModel.delete(savedChartUuid);
        analytics.track({
            event: 'saved_chart.deleted',
            userId: user.userUuid,
            properties: {
                savedQueryId: deletedChart.uuid,
                projectId: deletedChart.projectUuid,
            },
        });
    }

    async get(savedChartUuid: string, user: SessionUser): Promise<SavedChart> {
        const savedChart = await this.savedChartModel.get(savedChartUuid);
        if (user.ability.cannot('view', subject('SavedChart', savedChart))) {
            throw new ForbiddenError();
        }
        if (
            !(await this.hasChartSpaceAccess(
                savedChart.spaceUuid,
                user.userUuid,
            ))
        ) {
            throw new ForbiddenError(
                "You don't have access to the space this chart belongs to",
            );
        }

        await this.analyticsModel.addChartViewEvent(
            savedChartUuid,
            user.userUuid,
        );

        analytics.track({
            event: 'saved_chart.view',
            userId: user.userUuid,
            properties: {
                savedChartId: savedChart.uuid,
                organizationId: savedChart.organizationUuid,
                projectId: savedChart.projectUuid,
            },
        });

        const views = await this.analyticsModel.countChartViews(savedChartUuid);

        return {
            ...savedChart,
            views,
        };
    }

    async create(
        user: SessionUser,
        projectUuid: string,
        savedChart: CreateSavedChart,
    ): Promise<SavedChart> {
        const { organizationUuid } = await this.projectModel.get(projectUuid);
        if (
            user.ability.cannot(
                'create',
                subject('SavedChart', { organizationUuid, projectUuid }),
            )
        ) {
            throw new ForbiddenError();
        }
        const newSavedChart = await this.savedChartModel.create(
            projectUuid,
            user.userUuid,
            {
                ...savedChart,
                updatedByUser: user,
            },
        );
        analytics.track({
            event: 'saved_chart.created',
            userId: user.userUuid,
            properties:
                SavedChartService.getCreateEventProperties(newSavedChart),
        });
        return newSavedChart;
    }

    async duplicate(
        user: SessionUser,
        projectUuid: string,
        chartUuid: string,
    ): Promise<SavedChart> {
        const chart = await this.savedChartModel.get(chartUuid);
        if (user.ability.cannot('create', subject('SavedChart', chart))) {
            throw new ForbiddenError();
        }
        const duplicatedChart = {
            ...chart,
            name: `Copy of ${chart.name}`,
            updatedByUser: user,
        };
        const newSavedChart = await this.savedChartModel.create(
            projectUuid,
            user.userUuid,
            duplicatedChart,
        );
        const newSavedChartProperties =
            SavedChartService.getCreateEventProperties(newSavedChart);

        analytics.track({
            event: 'saved_chart.created',
            userId: user.userUuid,
            properties: {
                ...newSavedChartProperties,
                duplicated: true,
            },
        });

        analytics.track({
            event: 'duplicated_chart_created',
            userId: user.userUuid,
            properties: {
                ...newSavedChartProperties,
                newSavedQueryId: newSavedChartProperties.savedQueryId,
                duplicateOfSavedQueryId: chartUuid,
            },
        });
        return newSavedChart;
    }

    async getSchedulers(
        user: SessionUser,
        chartUuid: string,
    ): Promise<SchedulerAndTargets[]> {
        await this.checkUpdateAccess(user, chartUuid);
        return this.schedulerModel.getChartSchedulers(chartUuid);
    }

    async createScheduler(
        user: SessionUser,
        chartUuid: string,
        newScheduler: CreateSchedulerAndTargetsWithoutIds,
    ): Promise<SchedulerAndTargets> {
        if (!isUserWithOrg(user)) {
            throw new ForbiddenError('User is not part of an organization');
        }
        const { projectUuid, organizationUuid } = await this.checkUpdateAccess(
            user,
            chartUuid,
        );
        const scheduler = await this.schedulerModel.createScheduler({
            ...newScheduler,
            createdBy: user.userUuid,
            dashboardUuid: null,
            savedChartUuid: chartUuid,
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
