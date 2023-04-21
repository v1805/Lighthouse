import moment from 'moment/moment';
import { FilterOperator, UnitOfTime } from '../types/filter';
import { WeekDay } from '../utils/timeFrames';
import {
    renderDateFilterSql,
    renderNumberFilterSql,
    renderStringFilterSql,
} from './filtersCompiler';
import {
    DimensionSqlMock,
    ExpectedInTheCurrentFilterSQL,
    ExpectedInTheCurrentWeekFilterSQLWithCustomStartOfWeek,
    ExpectedInTheNextCompleteFilterSQL,
    ExpectedInTheNextCompleteWeekFilterSQLWithCustomStartOfWeek,
    ExpectedInTheNextFilterSQL,
    ExpectedInThePastCompleteWeekFilterSQLWithCustomStartOfWeek,
    ExpectedNumberFilterSQL,
    InBetweenPastTwoYearsFilter,
    InBetweenPastTwoYearsFilterSQL,
    InBetweenPastTwoYearsTimestampFilterSQL,
    InTheCurrentFilterBase,
    InTheLast1CompletedDayFilter,
    InTheLast1CompletedDayFilterSQL,
    InTheLast1CompletedHourFilter,
    InTheLast1CompletedHourFilterSQL,
    InTheLast1CompletedMinuteFilter,
    InTheLast1CompletedMinuteFilterSQL,
    InTheLast1CompletedMonthFilter,
    InTheLast1CompletedMonthFilterSQL,
    InTheLast1CompletedWeekFilter,
    InTheLast1CompletedWeekFilterSQL,
    InTheLast1CompletedYearFilter,
    InTheLast1CompletedYearFilterSQL,
    InTheLast1DayFilter,
    InTheLast1DayFilterSQL,
    InTheLast1HourFilter,
    InTheLast1HourFilterSQL,
    InTheLast1MinuteFilter,
    InTheLast1MinuteFilterSQL,
    InTheLast1MonthFilter,
    InTheLast1MonthFilterSQL,
    InTheLast1WeekFilter,
    InTheLast1WeekFilterSQL,
    InTheLast1YearFilter,
    InTheLast1YearFilterSQL,
    InTheNextFilterBase,
    InThePastFilterBase,
    NumberDimensionMock,
    NumberFilterBase,
    stringFilterDimension,
    stringFilterRuleMocks,
} from './filtersCompiler.mock';

const formatTimestamp = (date: Date): string =>
    moment(date).format('YYYY-MM-DD HH:mm:ss');

describe('Filter SQL', () => {
    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('04 Apr 2020 06:12:30 GMT').getTime());
    });
    afterAll(() => {
        jest.useFakeTimers();
    });
    test.each(Object.values(FilterOperator))(
        'should return number filter sql for operator %s',
        (operator) => {
            if (ExpectedNumberFilterSQL[operator]) {
                expect(
                    renderNumberFilterSql(NumberDimensionMock, {
                        ...NumberFilterBase,
                        operator,
                    }),
                ).toStrictEqual(ExpectedNumberFilterSQL[operator]);
            } else {
                expect(() => {
                    renderNumberFilterSql(NumberDimensionMock, {
                        ...NumberFilterBase,
                        operator,
                    });
                }).toThrow();
            }
        },
    );
    test.each(Object.values(UnitOfTime))(
        'should return in the current %s filter sql',
        (unitOfTime) => {
            jest.setSystemTime(new Date('04 Apr 2020 06:12:30 GMT').getTime());
            expect(
                renderDateFilterSql(
                    DimensionSqlMock,
                    {
                        ...InTheCurrentFilterBase,
                        settings: { unitOfTime },
                    },
                    formatTimestamp,
                ),
            ).toStrictEqual(ExpectedInTheCurrentFilterSQL[unitOfTime]);
        },
    );
    test.each(Object.values(UnitOfTime))(
        'should return in the next %s filter sql',
        (unitOfTime) => {
            jest.setSystemTime(new Date('04 Apr 2020 06:12:30 GMT').getTime());
            expect(
                renderDateFilterSql(
                    DimensionSqlMock,
                    {
                        ...InTheNextFilterBase,
                        settings: { unitOfTime },
                    },
                    formatTimestamp,
                ),
            ).toStrictEqual(ExpectedInTheNextFilterSQL[unitOfTime]);
        },
    );
    test.each(Object.values(UnitOfTime))(
        'should return in the next complete %s filter sql',
        (unitOfTime) => {
            jest.setSystemTime(new Date('04 Apr 2020 06:12:30 GMT').getTime());
            expect(
                renderDateFilterSql(
                    DimensionSqlMock,
                    {
                        ...InTheNextFilterBase,
                        settings: { unitOfTime, completed: true },
                    },
                    formatTimestamp,
                ),
            ).toStrictEqual(ExpectedInTheNextCompleteFilterSQL[unitOfTime]);
        },
    );
    test.each([WeekDay.MONDAY, WeekDay.SUNDAY])(
        'should return in the next complete week filter sql with %s as the start of the week',
        (weekDay) => {
            jest.setSystemTime(new Date('04 Apr 2020 06:12:30 GMT').getTime());
            const filter = {
                ...InTheNextFilterBase,
                settings: { unitOfTime: UnitOfTime.weeks, completed: true },
            };
            expect(
                renderDateFilterSql(
                    DimensionSqlMock,
                    filter,
                    formatTimestamp,
                    weekDay,
                ),
            ).toStrictEqual(
                ExpectedInTheNextCompleteWeekFilterSQLWithCustomStartOfWeek[
                    weekDay as WeekDay.MONDAY | WeekDay.SUNDAY
                ],
            );
        },
    );
    test.each([WeekDay.MONDAY, WeekDay.SUNDAY])(
        'should return in the last complete week filter sql with %s as the start of the week',
        (weekDay) => {
            jest.setSystemTime(new Date('04 Apr 2020 06:12:30 GMT').getTime());
            const filter = {
                ...InThePastFilterBase,
                settings: { unitOfTime: UnitOfTime.weeks, completed: true },
            };
            expect(
                renderDateFilterSql(
                    DimensionSqlMock,
                    filter,
                    formatTimestamp,
                    weekDay,
                ),
            ).toStrictEqual(
                ExpectedInThePastCompleteWeekFilterSQLWithCustomStartOfWeek[
                    weekDay as WeekDay.MONDAY | WeekDay.SUNDAY
                ],
            );
        },
    );
    test.each([WeekDay.MONDAY, WeekDay.SUNDAY])(
        'should return in the current complete week filter sql with %s as the start of the week',
        (weekDay) => {
            jest.setSystemTime(new Date('04 Apr 2020 06:12:30 GMT').getTime());
            const filter = {
                ...InTheCurrentFilterBase,
                settings: { unitOfTime: UnitOfTime.weeks, completed: true },
            };
            expect(
                renderDateFilterSql(
                    DimensionSqlMock,
                    filter,
                    formatTimestamp,
                    weekDay,
                ),
            ).toStrictEqual(
                ExpectedInTheCurrentWeekFilterSQLWithCustomStartOfWeek[
                    weekDay as WeekDay.MONDAY | WeekDay.SUNDAY
                ],
            );
        },
    );
    test('should return in the last date filter sql', () => {
        expect(
            renderDateFilterSql(DimensionSqlMock, InTheLast1DayFilter),
        ).toStrictEqual(InTheLast1DayFilterSQL);
        expect(
            renderDateFilterSql(DimensionSqlMock, InTheLast1WeekFilter),
        ).toStrictEqual(InTheLast1WeekFilterSQL);
        expect(
            renderDateFilterSql(DimensionSqlMock, InTheLast1MonthFilter),
        ).toStrictEqual(InTheLast1MonthFilterSQL);

        expect(
            renderDateFilterSql(DimensionSqlMock, InTheLast1YearFilter),
        ).toStrictEqual(InTheLast1YearFilterSQL);
    });

    test('should return in the last completed date filter sql ', () => {
        expect(
            renderDateFilterSql(DimensionSqlMock, InTheLast1CompletedDayFilter),
        ).toStrictEqual(InTheLast1CompletedDayFilterSQL);
        expect(
            renderDateFilterSql(
                DimensionSqlMock,
                InTheLast1CompletedWeekFilter,
            ),
        ).toStrictEqual(InTheLast1CompletedWeekFilterSQL);
        expect(
            renderDateFilterSql(
                DimensionSqlMock,
                InTheLast1CompletedMonthFilter,
            ),
        ).toStrictEqual(InTheLast1CompletedMonthFilterSQL);
        expect(
            renderDateFilterSql(
                DimensionSqlMock,
                InTheLast1CompletedYearFilter,
            ),
        ).toStrictEqual(InTheLast1CompletedYearFilterSQL);
    });

    test('should return in the last date filter sql for timestamps', () => {
        expect(
            renderDateFilterSql(
                DimensionSqlMock,
                InTheLast1HourFilter,
                formatTimestamp,
            ),
        ).toStrictEqual(InTheLast1HourFilterSQL);
        expect(
            renderDateFilterSql(
                DimensionSqlMock,
                InTheLast1CompletedHourFilter,
                formatTimestamp,
            ),
        ).toStrictEqual(InTheLast1CompletedHourFilterSQL);
        expect(
            renderDateFilterSql(
                DimensionSqlMock,
                InTheLast1MinuteFilter,
                formatTimestamp,
            ),
        ).toStrictEqual(InTheLast1MinuteFilterSQL);
        expect(
            renderDateFilterSql(
                DimensionSqlMock,
                InTheLast1CompletedMinuteFilter,
                formatTimestamp,
            ),
        ).toStrictEqual(InTheLast1CompletedMinuteFilterSQL);
    });

    test('should return in between date filter sql', () => {
        expect(
            renderDateFilterSql(DimensionSqlMock, InBetweenPastTwoYearsFilter),
        ).toStrictEqual(InBetweenPastTwoYearsFilterSQL);
    });

    test('should return in between date filter sql for timestamps', () => {
        expect(
            renderDateFilterSql(
                DimensionSqlMock,
                InBetweenPastTwoYearsFilter,
                formatTimestamp,
            ),
        ).toStrictEqual(InBetweenPastTwoYearsTimestampFilterSQL);
    });

    test('should return single value in includes filter sql', () => {
        expect(
            renderStringFilterSql(
                stringFilterDimension,
                stringFilterRuleMocks.includeFilterWithSingleVal,
                "'",
                "'",
            ),
        ).toBe(stringFilterRuleMocks.includeFilterWithSingleValSQL);
    });

    test('should return multiple values joined by OR in includes filter sql', () => {
        expect(
            renderStringFilterSql(
                stringFilterDimension,
                stringFilterRuleMocks.includeFilterWithMultiVal,
                "'",
                "'",
            ),
        ).toBe(stringFilterRuleMocks.includeFilterWithMultiValSQL);
    });

    test('should return true in includes filter sql for empty filter', () => {
        expect(
            renderStringFilterSql(
                stringFilterDimension,
                stringFilterRuleMocks.includeFilterWithNoVal,
                "'",
                "'",
            ),
        ).toBe(stringFilterRuleMocks.includeFilterWithNoValSQL);
    });

    test('should return single value in notIncludes filter sql', () => {
        expect(
            renderStringFilterSql(
                stringFilterDimension,
                stringFilterRuleMocks.notIncludeFilterWithSingleVal,
                "'",
                "'",
            ),
        ).toBe(stringFilterRuleMocks.notIncludeFilterWithSingleValSQL);
    });

    test('should return multiple values joined by AND in notIncludes filter sql', () => {
        expect(
            renderStringFilterSql(
                stringFilterDimension,
                stringFilterRuleMocks.notIncludeFilterWithMultiVal,
                "'",
                "'",
            ),
        ).toBe(stringFilterRuleMocks.notIncludeFilterWithMultiValSQL);
    });

    test('should return true in notIncludes filter sql for empty filter', () => {
        expect(
            renderStringFilterSql(
                stringFilterDimension,
                stringFilterRuleMocks.notIncludeFilterWithNoVal,
                "'",
                "'",
            ),
        ).toBe(stringFilterRuleMocks.notIncludeFilterWithNoValSQL);
    });

    test('should return single value in startsWith filter sql', () => {
        expect(
            renderStringFilterSql(
                stringFilterDimension,
                stringFilterRuleMocks.startsWithFilterWithSingleVal,
                "'",
                "'",
            ),
        ).toBe(stringFilterRuleMocks.startsWithFilterWithSingleValSQL);
    });

    test('should return multiple values joined by OR in startsWith filter sql', () => {
        expect(
            renderStringFilterSql(
                stringFilterDimension,
                stringFilterRuleMocks.startsWithFilterWithMultiVal,
                "'",
                "'",
            ),
        ).toBe(stringFilterRuleMocks.startsWithFilterWithMultiValSQL);
    });

    test('should return true in startsWith filter sql for empty filter', () => {
        expect(
            renderStringFilterSql(
                stringFilterDimension,
                stringFilterRuleMocks.startsWithFilterWithNoVal,
                "'",
                "'",
            ),
        ).toBe(stringFilterRuleMocks.startsWithFilterWithNoValSQL);
    });

    test('should return escaped query for unescaped single filter value', () => {
        expect(
            renderStringFilterSql(
                stringFilterDimension,
                stringFilterRuleMocks.equalsFilterWithSingleUnescapedValue,
                "'",
                "'",
            ),
        ).toBe(stringFilterRuleMocks.equalsFilterWithSingleUnescapedValueSQL);
    });

    test('should return escaped query for unescaped multi filter values', () => {
        expect(
            renderStringFilterSql(
                stringFilterDimension,
                stringFilterRuleMocks.equalsFilterWithMultiUnescapedValue,
                "'",
                "'",
            ),
        ).toBe(stringFilterRuleMocks.equalsFilterWithMultiUnescapedValueSQL);
    });
});
