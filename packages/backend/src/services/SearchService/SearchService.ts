import { subject } from '@casl/ability';
import {
    DashboardSearchResult,
    ForbiddenError,
    SavedChartSearchResult,
    SearchResults,
    SessionUser,
    SpaceSearchResult,
} from '@lightdash/common';
import { analytics } from '../../analytics/client';
import { ProjectModel } from '../../models/ProjectModel/ProjectModel';
import { SearchModel } from '../../models/SearchModel';
import { SpaceModel } from '../../models/SpaceModel';
import { hasSpaceAccess } from '../SpaceService/SpaceService';

type Dependencies = {
    searchModel: SearchModel;
    projectModel: ProjectModel;
    spaceModel: SpaceModel;
};

export class SearchService {
    private readonly searchModel: SearchModel;

    private readonly projectModel: ProjectModel;

    private readonly spaceModel: SpaceModel;

    constructor(dependencies: Dependencies) {
        this.searchModel = dependencies.searchModel;
        this.projectModel = dependencies.projectModel;
        this.spaceModel = dependencies.spaceModel;
    }

    async getSearchResults(
        user: SessionUser,
        projectUuid: string,
        query: string,
    ): Promise<SearchResults> {
        const { organizationUuid } = await this.projectModel.get(projectUuid);

        if (
            user.ability.cannot(
                'view',
                subject('Project', {
                    organizationUuid,
                    projectUuid,
                }),
            )
        ) {
            throw new ForbiddenError();
        }
        const results = await this.searchModel.search(projectUuid, query);
        const spaceUuids = [
            ...new Set([
                ...results.dashboards.map((dashboard) => dashboard.spaceUuid),
                ...results.savedCharts.map(
                    (savedChart) => savedChart.spaceUuid,
                ),
                ...results.spaces.map((space) => space.uuid),
            ]),
        ];
        const spaces = await Promise.all(
            spaceUuids.map((spaceUuid) =>
                this.spaceModel.getFullSpace(spaceUuid),
            ),
        );
        const filterItem = (
            item:
                | DashboardSearchResult
                | SpaceSearchResult
                | SavedChartSearchResult,
        ) => {
            const spaceUuid: string =
                'spaceUuid' in item ? item.spaceUuid : item.uuid;
            const itemSpace = spaces.find((s) => s.uuid === spaceUuid);
            return itemSpace && hasSpaceAccess(itemSpace, user.userUuid);
        };

        const hasExploreAccess = user.ability.can(
            'manage',
            subject('Explore', {
                organizationUuid,
                projectUuid,
            }),
        );

        const filteredResults = {
            ...results,
            tables: hasExploreAccess ? results.tables : [],
            fields: hasExploreAccess ? results.fields : [],
            dashboards: results.dashboards.filter(filterItem),
            savedCharts: results.savedCharts.filter(filterItem),
            spaces: results.spaces.filter(filterItem),
            pages: user.ability.can(
                'view',
                subject('Analytics', {
                    organizationUuid,
                }),
            )
                ? results.pages
                : [], // For now there is only 1 page and it is for admins only
        };
        analytics.track({
            event: 'project.search',
            userId: user.userUuid,
            properties: {
                projectId: projectUuid,
                spacesResultsCount: filteredResults.spaces.length,
                dashboardsResultsCount: filteredResults.dashboards.length,
                savedChartsResultsCount: filteredResults.savedCharts.length,
                tablesResultsCount: filteredResults.tables.length,
                fieldsResultsCount: filteredResults.fields.length,
            },
        });
        return filteredResults;
    }
}
