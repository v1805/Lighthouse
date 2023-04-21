import { CompileError } from '../types/errors';
import { friendlyName } from '../types/field';
import { ExploreCompiler } from './exploreCompiler';
import {
    compiledJoinedExploreOverridingAliasAndLabel,
    compiledJoinedExploreOverridingJoinAlias,
    compiledJoinedExploreOverridingJoinLabel,
    compiledJoinedExploreWithSubsetOfFields,
    compiledSimpleJoinedExplore,
    exploreCircularDimensionReference,
    exploreCircularDimensionShortReference,
    exploreCircularMetricReference,
    exploreCircularMetricShortReference,
    exploreComplexReference,
    exploreComplexReferenceCompiled,
    exploreMissingBaseTable,
    exploreMissingJoinTable,
    exploreOneEmptyTable,
    exploreOneEmptyTableCompiled,
    exploreReferenceDimension,
    exploreReferenceDimensionCompiled,
    exploreReferenceInJoin,
    exploreReferenceInJoinCompiled,
    exploreTableSelfReference,
    exploreTableSelfReferenceCompiled,
    exploreWithMetricNumber,
    exploreWithMetricNumberCompiled,
    joinedExploreOverridingAliasAndLabel,
    joinedExploreOverridingJoinAlias,
    joinedExploreOverridingJoinLabel,
    joinedExploreWithSubsetOfFields,
    joinedExploreWithSubsetOfFieldsCausingError,
    simpleJoinedExplore,
    tablesWithMetricsWithFilters,
    warehouseClientMock,
} from './exploreCompiler.mock';

const compiler = new ExploreCompiler(warehouseClientMock);

test('Should compile empty table', () => {
    expect(compiler.compileExplore(exploreOneEmptyTable)).toStrictEqual(
        exploreOneEmptyTableCompiled,
    );
});

test('Should throw error when missing base table', () => {
    expect(() => compiler.compileExplore(exploreMissingBaseTable)).toThrowError(
        CompileError,
    );
});

test('Should throw error when missing joined table', () => {
    expect(() => compiler.compileExplore(exploreMissingJoinTable)).toThrowError(
        CompileError,
    );
});

test('Should throw error when dimension/metric has circular reference', () => {
    expect(() =>
        compiler.compileExplore(exploreCircularDimensionReference),
    ).toThrowError(CompileError);
    expect(() =>
        compiler.compileExplore(exploreCircularDimensionShortReference),
    ).toThrowError(CompileError);
    expect(() =>
        compiler.compileExplore(exploreCircularMetricReference),
    ).toThrowError(CompileError);
    expect(() =>
        compiler.compileExplore(exploreCircularMetricShortReference),
    ).toThrowError(CompileError);
});

test('Should compile table with TABLE reference', () => {
    expect(compiler.compileExplore(exploreTableSelfReference)).toStrictEqual(
        exploreTableSelfReferenceCompiled,
    );
});

test('Should compile table with reference to another dimension', () => {
    expect(compiler.compileExplore(exploreReferenceDimension)).toStrictEqual(
        exploreReferenceDimensionCompiled,
    );
});

test('Should compile table with nested references in dimensions and metrics', () => {
    expect(compiler.compileExplore(exploreComplexReference)).toStrictEqual(
        exploreComplexReferenceCompiled,
    );
});

test('Should compile with a reference to a dimension in a joined table', () => {
    expect(compiler.compileExplore(exploreReferenceInJoin)).toStrictEqual(
        exploreReferenceInJoinCompiled,
    );
});

test('Should compile with a reference to a metric in a non-aggregate metric', () => {
    expect(compiler.compileExplore(exploreWithMetricNumber)).toStrictEqual(
        exploreWithMetricNumberCompiled,
    );
});

describe('Explores with a base table and joined table', () => {
    test('should compile', () => {
        expect(compiler.compileExplore(simpleJoinedExplore)).toStrictEqual(
            compiledSimpleJoinedExplore,
        );
    });
    test('should compile with a reference to a dimension in a joined table', () => {
        expect(compiler.compileExplore(exploreReferenceInJoin)).toStrictEqual(
            exploreReferenceInJoinCompiled,
        );
    });
    test('should compile with custom label on join', () => {
        expect(
            compiler.compileExplore(joinedExploreOverridingJoinLabel),
        ).toStrictEqual(compiledJoinedExploreOverridingJoinLabel);
    });
    test('should compile with alias on join', () => {
        expect(
            compiler.compileExplore(joinedExploreOverridingJoinAlias),
        ).toStrictEqual(compiledJoinedExploreOverridingJoinAlias);
    });
    test('should compile with an alias and custom label on join', () => {
        expect(
            compiler.compileExplore(joinedExploreOverridingAliasAndLabel),
        ).toStrictEqual(compiledJoinedExploreOverridingAliasAndLabel);
    });
    test('should compile with a subset of fields selected on join', () => {
        expect(
            compiler.compileExplore(joinedExploreWithSubsetOfFields),
        ).toStrictEqual(compiledJoinedExploreWithSubsetOfFields);
    });
    test('should throw error if referenced field is removed from join', () => {
        expect(() =>
            compiler.compileExplore(
                joinedExploreWithSubsetOfFieldsCausingError,
            ),
        ).toThrowError(CompileError);
    });
});

describe('Default field labels render for', () => {
    test('uppercase field names', () => {
        expect(friendlyName('MYFIELDID')).toEqual('Myfieldid');
        expect(friendlyName('MY_FIELD_ID')).toEqual('My field id');
    });
    test('camel case names', () => {
        expect(friendlyName('myFieldId')).toEqual('My field id');
    });
    test('snake case names', () => {
        expect(friendlyName('my_field_id')).toEqual('My field id');
    });
    test('names with numbers at the start', () => {
        expect(friendlyName('1_field_id')).toEqual('1 field id');
    });
    test('names with numbers in the middle', () => {
        expect(friendlyName('my_1field_id')).toEqual('My 1field id');
    });
});

describe('Compile metrics with filters', () => {
    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('04 Apr 2020 00:12:00 GMT').getTime());
    });
    afterAll(() => {
        jest.useFakeTimers();
    });
    test('should show filters as columns metric1', () => {
        expect(
            compiler.compileMetric(
                tablesWithMetricsWithFilters.table1.metrics.metric1,
                tablesWithMetricsWithFilters,
            ).compiledSql,
        ).toStrictEqual(
            `MAX(CASE WHEN (LOWER("table1".shared) LIKE LOWER('%foo%')) THEN ("table1".number_column) ELSE NULL END)`,
        );
    });
    test('should show filters as columns metric2', () => {
        expect(
            compiler.compileMetric(
                tablesWithMetricsWithFilters.table2.metrics.metric2,
                tablesWithMetricsWithFilters,
            ).compiledSql,
        ).toStrictEqual(
            `MAX(CASE WHEN (("table2".dim2) < (10) AND ("table2".dim2) > (5)) THEN ("table2".number_column) ELSE NULL END)`,
        );
    });

    test('should show filters as columns metric with sql', () => {
        expect(
            compiler.compileMetric(
                tablesWithMetricsWithFilters.table1.metrics.metric_with_sql,
                tablesWithMetricsWithFilters,
            ).compiledSql,
        ).toStrictEqual(
            `MAX(CASE WHEN (LOWER("table1".shared) LIKE LOWER('%foo%')) THEN (CASE WHEN "table1".number_column THEN 1 ELSE 0 END) ELSE NULL END)`,
        );
    });
});
