import { buildQuery } from './queryBuilder';
import {
    bigqueryClientMock,
    EXPLORE,
    EXPLORE_BIGQUERY,
    EXPLORE_JOIN_CHAIN,
    METRIC_QUERY,
    METRIC_QUERY_JOIN_CHAIN,
    METRIC_QUERY_JOIN_CHAIN_SQL,
    METRIC_QUERY_SQL,
    METRIC_QUERY_SQL_BIGQUERY,
    METRIC_QUERY_SQL_WITH_NO_LIMIT,
    METRIC_QUERY_TWO_TABLES,
    METRIC_QUERY_TWO_TABLES_SQL,
    METRIC_QUERY_WITH_ADDITIONAL_METRIC,
    METRIC_QUERY_WITH_ADDITIONAL_METRIC_SQL,
    METRIC_QUERY_WITH_EMPTY_FILTER,
    METRIC_QUERY_WITH_EMPTY_FILTER_GROUPS,
    METRIC_QUERY_WITH_EMPTY_FILTER_SQL,
    METRIC_QUERY_WITH_EMPTY_METRIC_FILTER,
    METRIC_QUERY_WITH_EMPTY_METRIC_FILTER_SQL,
    METRIC_QUERY_WITH_FILTER,
    METRIC_QUERY_WITH_FILTER_OR_OPERATOR,
    METRIC_QUERY_WITH_FILTER_OR_OPERATOR_SQL,
    METRIC_QUERY_WITH_FILTER_SQL,
    METRIC_QUERY_WITH_METRIC_FILTER,
    METRIC_QUERY_WITH_METRIC_FILTER_SQL,
    METRIC_QUERY_WITH_NESTED_FILTER_OPERATORS,
    METRIC_QUERY_WITH_NESTED_FILTER_OPERATORS_SQL,
    METRIC_QUERY_WITH_TABLE_REFERENCE,
    METRIC_QUERY_WITH_TABLE_REFERENCE_SQL,
    warehouseClientMock,
} from './queryBuilder.mock';

describe('Query builder', () => {
    test('Should build simple metric query', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery: METRIC_QUERY,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_SQL);
    });

    test('Should build simple metric query in BigQuery', () => {
        expect(
            buildQuery({
                explore: EXPLORE_BIGQUERY,
                compiledMetricQuery: METRIC_QUERY,
                warehouseClient: bigqueryClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_SQL_BIGQUERY);
    });

    test('Should build metric query across two tables', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery: METRIC_QUERY_TWO_TABLES,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_TWO_TABLES_SQL);
    });

    test('Should build metric query where a field references another table', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery: METRIC_QUERY_WITH_TABLE_REFERENCE,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_WITH_TABLE_REFERENCE_SQL);
    });

    test('Should join table from filter dimension', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery: METRIC_QUERY_WITH_FILTER,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_WITH_FILTER_SQL);
    });

    test('should join chain of intermediary tables', () => {
        expect(
            buildQuery({
                explore: EXPLORE_JOIN_CHAIN,
                compiledMetricQuery: METRIC_QUERY_JOIN_CHAIN,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_JOIN_CHAIN_SQL);
    });

    test('Should build query with filter OR operator', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery: METRIC_QUERY_WITH_FILTER_OR_OPERATOR,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_WITH_FILTER_OR_OPERATOR_SQL);
    });
    test('Should build query with nested filter operators', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery: METRIC_QUERY_WITH_NESTED_FILTER_OPERATORS,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_WITH_NESTED_FILTER_OPERATORS_SQL);
    });
    test('Should build query with no filter when there are only empty filter groups ', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery: METRIC_QUERY_WITH_EMPTY_FILTER_GROUPS,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_SQL);
    });
    test('Should build second query with metric filter', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery: METRIC_QUERY_WITH_METRIC_FILTER,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_WITH_METRIC_FILTER_SQL);
    });

    test('Should build query with additional metric', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery: METRIC_QUERY_WITH_ADDITIONAL_METRIC,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_WITH_ADDITIONAL_METRIC_SQL);
    });

    test('Should build query with empty filter', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery: METRIC_QUERY_WITH_EMPTY_FILTER,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_WITH_EMPTY_FILTER_SQL);
    });

    test('Should build query with empty metric filter', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery: METRIC_QUERY_WITH_EMPTY_METRIC_FILTER,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_WITH_EMPTY_METRIC_FILTER_SQL);
    });
});
