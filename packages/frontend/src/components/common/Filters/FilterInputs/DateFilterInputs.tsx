import { NumericInput } from '@blueprintjs/core';
import { DateInput2 } from '@blueprintjs/datetime2';
import {
    ConditionalRule,
    DateFilterRule,
    DimensionType,
    FilterOperator,
    formatDate,
    isDimension,
    isField,
    isFilterRule,
    isWeekDay,
    parseDate,
    TimeFrames,
    UnitOfTime,
} from '@lightdash/common';
import moment from 'moment';
import React from 'react';
import MonthAndYearInput from '../../MonthAndYearInput';
import WeekPicker, { convertWeekDayToDayPickerWeekDay } from '../../WeekPicker';
import YearInput from '../../YearInput';
import { useFiltersContext } from '../FiltersProvider';
import DefaultFilterInputs, { FilterInputsProps } from './DefaultFilterInputs';
import {
    MultipleInputsWrapper,
    StyledDateRangeInput,
} from './FilterInputs.styles';
import UnitOfTimeAutoComplete from './UnitOfTimeAutoComplete';

const DateFilterInputs = <T extends ConditionalRule = DateFilterRule>(
    props: React.PropsWithChildren<FilterInputsProps<T>>,
) => {
    const { field, rule, onChange, popoverProps, disabled } = props;
    const { startOfWeek } = useFiltersContext();
    const isTimestamp =
        isField(field) && field.type === DimensionType.TIMESTAMP;

    if (!isFilterRule(rule)) {
        throw new Error('DateFilterInputs expects a FilterRule');
    }

    switch (rule.operator) {
        case FilterOperator.EQUALS:
        case FilterOperator.NOT_EQUALS:
        case FilterOperator.GREATER_THAN:
        case FilterOperator.GREATER_THAN_OR_EQUAL:
        case FilterOperator.LESS_THAN:
        case FilterOperator.LESS_THAN_OR_EQUAL:
            if (isDimension(field) && field.timeInterval) {
                switch (field.timeInterval.toUpperCase()) {
                    case TimeFrames.WEEK:
                        return (
                            <>
                                <span style={{ whiteSpace: 'nowrap' }}>
                                    week commencing
                                </span>
                                <WeekPicker
                                    disabled={disabled}
                                    value={rule.values?.[0] || new Date()}
                                    popoverProps={popoverProps}
                                    startOfWeek={startOfWeek}
                                    onChange={(value: Date) => {
                                        onChange({
                                            ...rule,
                                            values: [moment(value).toDate()],
                                        });
                                    }}
                                />
                            </>
                        );
                    case TimeFrames.MONTH:
                        return (
                            <MonthAndYearInput
                                disabled={disabled}
                                value={rule.values?.[0] || new Date()}
                                onChange={(value: Date) => {
                                    onChange({
                                        ...rule,
                                        values: [
                                            moment(value)
                                                .startOf('month')
                                                .toDate(),
                                        ],
                                    });
                                }}
                            />
                        );
                    case TimeFrames.YEAR:
                        return (
                            <YearInput
                                disabled={disabled}
                                value={rule.values?.[0] || new Date()}
                                onChange={(value: Date) => {
                                    onChange({
                                        ...rule,
                                        values: [
                                            moment(value)
                                                .startOf('year')
                                                .toDate(),
                                        ],
                                    });
                                }}
                            />
                        );
                    default:
                        break;
                }
            }

            if (isTimestamp) {
                return (
                    <DateInput2
                        className={disabled ? 'disabled-filter' : ''}
                        disabled={disabled}
                        fill
                        defaultTimezone="UTC"
                        showTimezoneSelect={false}
                        value={
                            rule.values?.[0]
                                ? new Date(rule.values?.[0]).toString()
                                : new Date().toString()
                        }
                        timePrecision={'millisecond'}
                        formatDate={(value: Date) =>
                            moment(value).format(`YYYY-MM-DD, HH:mm:ss:SSS`)
                        }
                        parseDate={(value) =>
                            moment(value, `YYYY-MM-DD, HH:mm:ss:SSS`).toDate()
                        }
                        defaultValue={new Date().toString()}
                        onChange={(value: string | null) => {
                            if (value) {
                                onChange({
                                    ...rule,
                                    values: [value],
                                });
                            }
                        }}
                        popoverProps={{
                            placement: 'bottom',
                            ...popoverProps,
                        }}
                        dayPickerProps={{
                            firstDayOfWeek: isWeekDay(startOfWeek)
                                ? convertWeekDayToDayPickerWeekDay(startOfWeek)
                                : undefined,
                        }}
                    />
                );
            }
            return (
                <DateInput2
                    className={disabled ? 'disabled-filter' : ''}
                    disabled={disabled}
                    fill
                    value={
                        rule.values?.[0]
                            ? formatDate(rule.values?.[0], undefined, false)
                            : new Date().toString()
                    }
                    formatDate={(value: Date) =>
                        formatDate(value, undefined, false)
                    }
                    parseDate={parseDate}
                    defaultValue={new Date().toString()}
                    onChange={(value: string | null) => {
                        if (value) {
                            onChange({
                                ...rule,
                                values: [formatDate(value, undefined, false)],
                            });
                        }
                    }}
                    popoverProps={{
                        placement: 'bottom',
                        ...popoverProps,
                    }}
                    dayPickerProps={{
                        firstDayOfWeek: isWeekDay(startOfWeek)
                            ? convertWeekDayToDayPickerWeekDay(startOfWeek)
                            : undefined,
                    }}
                />
            );
        case FilterOperator.IN_THE_PAST:
        case FilterOperator.IN_THE_NEXT:
            const parsedValue = parseInt(rule.values?.[0], 10);
            return (
                <MultipleInputsWrapper>
                    <NumericInput
                        className={disabled ? 'disabled-filter' : ''}
                        fill
                        disabled={disabled}
                        value={isNaN(parsedValue) ? undefined : parsedValue}
                        min={0}
                        onValueChange={(value) =>
                            onChange({
                                ...rule,
                                values: [value],
                            })
                        }
                    />
                    <UnitOfTimeAutoComplete
                        disabled={disabled}
                        isTimestamp={isTimestamp}
                        unitOfTime={
                            rule.settings?.unitOfTime || UnitOfTime.days
                        }
                        completed={rule.settings?.completed || false}
                        popoverProps={popoverProps}
                        onChange={(value) =>
                            onChange({
                                ...rule,
                                settings: {
                                    unitOfTime: value.unitOfTime,
                                    completed: value.completed,
                                },
                            })
                        }
                    />
                </MultipleInputsWrapper>
            );
        case FilterOperator.IN_THE_CURRENT:
            return (
                <MultipleInputsWrapper>
                    <UnitOfTimeAutoComplete
                        disabled={disabled}
                        isTimestamp={isTimestamp}
                        unitOfTime={
                            rule.settings?.unitOfTime || UnitOfTime.days
                        }
                        showOptionsInPlural={false}
                        showCompletedOptions={false}
                        completed={false}
                        popoverProps={popoverProps}
                        onChange={(value) =>
                            onChange({
                                ...rule,
                                settings: {
                                    unitOfTime: value.unitOfTime,
                                    completed: false,
                                },
                            })
                        }
                    />
                </MultipleInputsWrapper>
            );
        case FilterOperator.IN_BETWEEN:
            if (isTimestamp) {
                return (
                    <MultipleInputsWrapper>
                        <StyledDateRangeInput
                            allowSingleDayRange
                            className={disabled ? 'disabled-filter' : ''}
                            disabled={disabled}
                            formatDate={(value: Date) =>
                                moment(value)
                                    .format(`YYYY-MM-DD, HH:mm:ss:SSS`)
                                    .toString()
                            }
                            parseDate={(value) =>
                                moment(
                                    value,
                                    `YYYY-MM-DD, HH:mm:ss:SSS`,
                                ).toDate()
                            }
                            value={[
                                rule.values?.[0]
                                    ? new Date(rule.values?.[0])
                                    : new Date(),
                                rule.values?.[1]
                                    ? new Date(rule.values?.[1])
                                    : moment(rule.values?.[0] || new Date())
                                          .add(2, 'hours')
                                          .milliseconds(0)
                                          .toDate(),
                            ]}
                            timePrecision="millisecond"
                            onChange={(
                                range: [Date | null, Date | null] | null,
                            ) => {
                                if (range && (range[0] || range[1])) {
                                    onChange({
                                        ...rule,
                                        values: [range[0], range[1]],
                                    });
                                }
                            }}
                            popoverProps={{
                                placement: 'bottom',
                                ...popoverProps,
                            }}
                            dayPickerProps={{
                                firstDayOfWeek: isWeekDay(startOfWeek)
                                    ? convertWeekDayToDayPickerWeekDay(
                                          startOfWeek,
                                      )
                                    : undefined,
                            }}
                            closeOnSelection={false}
                            shortcuts={false}
                        />
                    </MultipleInputsWrapper>
                );
            }
            return (
                <MultipleInputsWrapper>
                    <StyledDateRangeInput
                        className={disabled ? 'disabled-filter' : ''}
                        disabled={disabled}
                        formatDate={(value: Date) =>
                            formatDate(value, undefined, false)
                        }
                        parseDate={parseDate}
                        value={[
                            rule.values?.[0]
                                ? parseDate(
                                      formatDate(
                                          rule.values?.[0],
                                          undefined,
                                          false,
                                      ),
                                      TimeFrames.DAY,
                                  )
                                : null,
                            rule.values?.[1]
                                ? parseDate(
                                      formatDate(
                                          rule.values?.[1],
                                          undefined,
                                          false,
                                      ),
                                      TimeFrames.DAY,
                                  )
                                : null,
                        ]}
                        onChange={(
                            range: [Date | null, Date | null] | null,
                        ) => {
                            if (range && (range[0] || range[1])) {
                                onChange({
                                    ...rule,
                                    values: [
                                        formatDate(
                                            range[0]
                                                ? range[0]
                                                : moment(range[1]).add(
                                                      -1,
                                                      'days',
                                                  ),
                                            undefined,
                                            false,
                                        ),
                                        formatDate(
                                            range[1]
                                                ? range[1]
                                                : moment(range[0]).add(
                                                      1,
                                                      'days',
                                                  ),
                                            undefined,
                                            false,
                                        ),
                                    ],
                                });
                            }
                        }}
                        popoverProps={{
                            placement: 'bottom',
                            ...popoverProps,
                        }}
                        dayPickerProps={{
                            firstDayOfWeek: isWeekDay(startOfWeek)
                                ? convertWeekDayToDayPickerWeekDay(startOfWeek)
                                : undefined,
                        }}
                        closeOnSelection={true}
                        shortcuts={false}
                    />
                </MultipleInputsWrapper>
            );
        default: {
            return <DefaultFilterInputs {...props} />;
        }
    }
};

export default DateFilterInputs;
