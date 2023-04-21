import { Dashboard } from './dashboard';
import { Table } from './explore';
import { Dimension, Metric } from './field';
import { SavedChart } from './savedCharts';
import { Space } from './space';

export type SpaceSearchResult = Pick<Space, 'uuid' | 'name' | 'uuid'>;
export type DashboardSearchResult = Pick<
    Dashboard,
    'uuid' | 'name' | 'description' | 'spaceUuid'
>;
export type SavedChartSearchResult = Pick<
    SavedChart,
    'uuid' | 'name' | 'description' | 'spaceUuid'
>;
export type TableSearchResult = Pick<
    Table,
    'name' | 'label' | 'description'
> & {
    explore: string;
    exploreLabel: string;
};
export type FieldSearchResult = Pick<
    Dimension | Metric,
    | 'name'
    | 'label'
    | 'description'
    | 'type'
    | 'fieldType'
    | 'table'
    | 'tableLabel'
> & {
    explore: string;
    exploreLabel: string;
};

type PageResult = {
    uuid: string;
    name: string;
    url: string;
};

export type SearchResult =
    | SpaceSearchResult
    | DashboardSearchResult
    | SavedChartSearchResult
    | TableSearchResult
    | FieldSearchResult
    | PageResult;

export const isExploreSearchResult = (
    value: SearchResult,
): value is TableSearchResult | FieldSearchResult => 'explore' in value;

export const isFieldSearchResult = (
    value: SearchResult,
): value is FieldSearchResult => 'table' in value;

export type SearchResults = {
    spaces: SpaceSearchResult[];
    dashboards: DashboardSearchResult[];
    savedCharts: SavedChartSearchResult[];
    tables: TableSearchResult[];
    fields: FieldSearchResult[];
    pages: PageResult[];
};

export const getSearchResultId = (meta: SearchResult | undefined) => {
    if (!meta) {
        return '';
    }
    if (isExploreSearchResult(meta)) {
        if (isFieldSearchResult(meta)) {
            return `${meta.explore}.${meta.table}.${meta.name}`;
        }
        return `${meta.explore}.${meta.name}`;
    }
    return meta.uuid;
};
