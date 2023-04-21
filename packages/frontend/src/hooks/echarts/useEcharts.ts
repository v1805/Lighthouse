import {
    ApiQueryResults,
    CartesianChart,
    CartesianSeriesType,
    CompiledField,
    convertAdditionalMetric,
    DimensionType,
    ECHARTS_DEFAULT_COLORS,
    Field,
    findItem,
    formatItemValue,
    formatValue,
    friendlyName,
    getAxisName,
    getDefaultSeriesColor,
    getFieldLabel,
    getFieldMap,
    getFields,
    getItemId,
    getItemLabelWithoutTableName,
    getResultValues,
    hashFieldReference,
    isCompleteLayout,
    isDimension,
    isField,
    isPivotReferenceWithValues,
    isTimeInterval,
    Metric,
    MetricType,
    PivotReference,
    ResultRow,
    Series,
    TableCalculation,
    timeFrameConfigs,
} from '@lightdash/common';
import groupBy from 'lodash-es/groupBy';
import toNumber from 'lodash-es/toNumber';
import moment from 'moment';
import { useMemo } from 'react';
import { defaultGrid } from '../../components/ChartConfigPanel/Grid';
import { useVisualizationContext } from '../../components/LightdashVisualization/VisualizationProvider';
import { EMPTY_X_AXIS } from '../cartesianChartConfig/useCartesianChartConfig';
import { useOrganization } from '../organization/useOrganization';
import usePlottedData from '../plottedData/usePlottedData';

const getLabelFromField = (
    fields: Array<Field | TableCalculation>,
    key: string | undefined,
) => {
    const item = findItem(fields, key);
    if (item) {
        return isField(item)
            ? getItemLabelWithoutTableName(item)
            : item.displayName;
    } else if (key) {
        return friendlyName(key);
    } else {
        return '';
    }
};

const getAxisTypeFromField = (item?: Field | TableCalculation): string => {
    if (item && isField(item)) {
        switch (item.type) {
            case DimensionType.NUMBER:
            case MetricType.NUMBER:
            case MetricType.PERCENTILE:
            case MetricType.MEDIAN:

            case MetricType.AVERAGE:
            case MetricType.COUNT:
            case MetricType.COUNT_DISTINCT:
            case MetricType.SUM:
            case MetricType.MIN:
            case MetricType.MAX:
                return 'value';
            case DimensionType.TIMESTAMP:
            case DimensionType.DATE:
            case MetricType.DATE:
                return 'time';
            default: {
                return 'category';
            }
        }
    } else {
        return 'value';
    }
};

type GetAxisTypeArg = {
    validCartesianConfig: CartesianChart;
    itemMap: Record<string, Field | TableCalculation>;
    topAxisXId?: string;
    bottomAxisXId?: string;
    rightAxisYId?: string;
    leftAxisYId?: string;
};
const getAxisType = ({
    validCartesianConfig,
    itemMap,
    topAxisXId,
    bottomAxisXId,
    rightAxisYId,
    leftAxisYId,
}: GetAxisTypeArg) => {
    const topAxisType = getAxisTypeFromField(
        topAxisXId ? itemMap[topAxisXId] : undefined,
    );
    const bottomAxisType =
        bottomAxisXId === EMPTY_X_AXIS
            ? 'category'
            : getAxisTypeFromField(
                  bottomAxisXId ? itemMap[bottomAxisXId] : undefined,
              );
    // horizontal bar chart needs the type 'category' in the left/right axis
    const defaultRightAxisType = getAxisTypeFromField(
        rightAxisYId ? itemMap[rightAxisYId] : undefined,
    );
    const rightAxisType =
        validCartesianConfig.layout.flipAxes &&
        defaultRightAxisType === 'value' &&
        (
            validCartesianConfig.eChartsConfig.series?.find(
                (serie) => serie.yAxisIndex === 1,
            ) || validCartesianConfig.eChartsConfig.series?.[0]
        )?.type === CartesianSeriesType.BAR
            ? 'category'
            : defaultRightAxisType;
    const defaultLeftAxisType = getAxisTypeFromField(
        leftAxisYId ? itemMap[leftAxisYId] : undefined,
    );
    const leftAxisType =
        validCartesianConfig.layout.flipAxes &&
        defaultLeftAxisType === 'value' &&
        (
            validCartesianConfig.eChartsConfig.series?.find(
                (serie) => serie.yAxisIndex === 0,
            ) || validCartesianConfig.eChartsConfig.series?.[0]
        )?.type === CartesianSeriesType.BAR
            ? 'category'
            : defaultLeftAxisType;

    return {
        topAxisType,
        bottomAxisType,
        rightAxisType,
        leftAxisType,
    };
};

export const getAxisDefaultMinValue = ({
    min,
    max,
}: {
    min: any;
    max: any;
}) => {
    if (
        isNaN(parseInt(min)) ||
        isNaN(parseInt(max)) ||
        min instanceof Date ||
        max instanceof Date
    ) {
        return undefined;
    } else if (min >= 0 && min > (max - min) * 3) {
        return min;
    }
    return undefined;
};

const maybeGetAxisDefaultMinValue = (allowFunction: boolean) =>
    allowFunction ? getAxisDefaultMinValue : undefined;

export const getAxisDefaultMaxValue = ({
    min,
    max,
}: {
    min: any;
    max: any;
}) => {
    if (
        isNaN(parseInt(min)) ||
        isNaN(parseInt(max)) ||
        min instanceof Date ||
        max instanceof Date
    ) {
        return undefined;
    } else if (max < 0 && Math.abs(max) > Math.abs(min - max) * 3) {
        return max;
    }
    return undefined;
};

const maybeGetAxisDefaultMaxValue = (allowFunction: boolean) =>
    allowFunction ? getAxisDefaultMaxValue : undefined;

export type EChartSeries = {
    type: Series['type'];
    connectNulls: boolean;
    stack?: string;
    stackLabel?: {
        show?: boolean;
    };
    name?: string;
    color?: string;
    yAxisIndex?: number;
    xAxisIndex?: number;
    encode?: {
        x: string;
        y: string;
        tooltip: string[];
        seriesName: string;
    };
    dimensions?: Array<{ name: string; displayName: string }>;
    emphasis?: {
        focus?: string;
    };
    areaStyle?: any;
    pivotReference?: PivotReference;
    label?: {
        show?: boolean;
        fontSize?: number;
        fontWeight?: string;
        position?: 'left' | 'top' | 'right' | 'bottom' | 'inside';
        formatter?: (param: { data: Record<string, unknown> }) => string;
    };
    labelLayout?: {
        hideOverlap?: boolean;
    };
    tooltip?: {
        show?: boolean;
        valueFormatter?: (value: unknown) => string;
    };
    data?: unknown[];
};

const getFormattedValue = (
    value: any,
    key: string,
    items: Array<Field | TableCalculation>,
): string => {
    return formatItemValue(
        items.find((item) => getItemId(item) === key),
        value,
        true,
    );
};

const valueFormatter =
    (yFieldId: string, items: Array<Field | TableCalculation>) =>
    (rawValue: any) => {
        return getFormattedValue(rawValue, yFieldId, items);
    };

const removeEmptyProperties = <T = Record<any, any>>(obj: T | undefined) => {
    if (!obj) return undefined;
    return Object.entries(obj).reduce(
        (sum, [key, value]) =>
            value !== undefined && value !== ''
                ? { ...sum, [key]: value }
                : sum,
        {},
    );
};

export const getMinAndMaxValues = (
    axis: string | undefined,
    rows: ResultRow[],
): (string | number)[] => {
    if (!axis) return [];
    return rows
        .map((row) => row[axis]?.value?.raw)
        .reduce<(string | number)[]>(
            (acc, value) => {
                if (typeof value === 'number') {
                    const min = acc[0] < value ? acc[0] : value;
                    const max = acc[1] > value ? acc[1] : value;
                    return [min, max];
                } else if (typeof value === 'string') {
                    if (moment(value, 'YYYY-MM-DD', false).isValid()) {
                        // is date
                        const min = acc[0] < value ? acc[0] : value;
                        const max = acc[1] > value ? acc[1] : value;
                        return [min, max];
                    }
                    const number = parseFloat(value);
                    if (!isNaN(number)) {
                        // is float
                        const min = acc[0] < number ? acc[0] : number;
                        const max = acc[1] > number ? acc[1] : number;
                        return [min, max];
                    }
                }
                return acc;
            },
            [0, 0],
        );
};

const getMinAndMaxReferenceLines = (
    leftAxisYId: string | undefined,
    rightAxisYId: string | undefined,
    bottomAxisXId: string | undefined,
    resultsData: ApiQueryResults | undefined,
    series: Series[] | undefined,
    items: Array<Field | TableCalculation>,
) => {
    if (resultsData === undefined || series === undefined) return {};
    // Skip method if there are no reference lines
    const hasReferenceLines =
        series.find((serie) => {
            const data = serie.markLine?.data;
            return data !== undefined && data.length > 0;
        }) !== undefined;

    if (!hasReferenceLines) return {};

    const getMinAndMaxReferenceLineValues = (
        axis: string,
        fieldId: string | undefined,
    ): (string | number)[] => {
        const values = series.flatMap<string | number>((serie) => {
            const serieFieldId =
                axis === 'yAxis' ? serie.encode.yRef : serie.encode.xRef;
            if (serieFieldId.field !== fieldId) return [];

            if (!serie.markLine) return [];
            const field = findItem(items, serieFieldId.field);

            const fieldType = isField(field) ? field.type : undefined;

            switch (fieldType) {
                case DimensionType.NUMBER:
                case MetricType.NUMBER:
                case MetricType.AVERAGE:
                case MetricType.COUNT:
                case MetricType.COUNT_DISTINCT:
                case MetricType.SUM:
                case MetricType.MEDIAN:
                case MetricType.PERCENTILE:
                case MetricType.MIN:
                case MetricType.MAX:
                    return serie.markLine?.data.reduce<number[]>(
                        (acc, data) => {
                            try {
                                const axisValue =
                                    axis === 'yAxis' ? data.yAxis : data.xAxis;
                                if (axisValue === undefined) return acc;
                                const value = parseInt(axisValue);
                                if (isNaN(value)) return acc;
                                return [...acc, value];
                            } catch (e) {
                                console.error(
                                    `Unexpected value when getting numbers min/max for ${fieldType}: ${JSON.stringify(
                                        data,
                                    )}`,
                                );
                                return acc;
                            }
                        },
                        [],
                    );

                case DimensionType.TIMESTAMP:
                case DimensionType.DATE:
                case MetricType.DATE:
                    return serie.markLine?.data.reduce<string[]>(
                        (acc, data) => {
                            try {
                                const axisValue =
                                    axis === 'yAxis' ? data.yAxis : data.xAxis;
                                if (axisValue === undefined) return acc;
                                return [...acc, axisValue];
                            } catch (e) {
                                console.error(
                                    `Unexpected value when getting date min/max for ${fieldType}: ${data}`,
                                );
                                return acc;
                            }
                        },
                        [],
                    );
                default: {
                    // We will try getting values for TableCalculations
                    return serie.markLine?.data.reduce<number[]>(
                        (acc, data) => {
                            try {
                                const axisValue =
                                    axis === 'yAxis' ? data.yAxis : data.xAxis;
                                if (axisValue === undefined) return acc;
                                const value = parseInt(axisValue);
                                if (isNaN(value)) return acc;
                                return [...acc, value];
                            } catch (e) {
                                console.error(
                                    `Unexpected value when getting numbers min/max for ${fieldType}: ${JSON.stringify(
                                        data,
                                    )}`,
                                );
                                return acc;
                            }
                        },
                        [],
                    );
                }
            }
        });

        if (values.length === 0) return [];
        const min: string | number = values.sort()[0];
        const max = values.reverse()[0];
        return [min, max];
    };

    const [minValueLeftY, maxValueLeftY] = getMinAndMaxValues(
        leftAxisYId,
        resultsData.rows,
    );
    const [minValueRightY, maxValueRightY] = getMinAndMaxValues(
        rightAxisYId,
        resultsData.rows,
    );
    const [minValueX, maxValueX] = getMinAndMaxValues(
        bottomAxisXId,
        resultsData.rows,
    );

    const [minReferenceLineX, maxReferenceLineX] =
        getMinAndMaxReferenceLineValues('xAxis', bottomAxisXId);
    const [minReferenceLineLeftY, maxReferenceLineLeftY] =
        getMinAndMaxReferenceLineValues('yAxis', leftAxisYId);
    const [minReferenceLineRightY, maxReferenceLineRightY] =
        getMinAndMaxReferenceLineValues('yAxis', rightAxisYId);

    return {
        referenceLineMinX:
            minReferenceLineX < minValueX ? minReferenceLineX : undefined,
        referenceLineMaxX:
            maxReferenceLineX > maxValueX ? maxReferenceLineX : undefined,
        referenceLineMinLeftY:
            minReferenceLineLeftY < minValueLeftY
                ? minReferenceLineLeftY
                : undefined,
        referenceLineMaxLeftY:
            maxReferenceLineLeftY > maxValueLeftY
                ? maxReferenceLineLeftY
                : undefined,
        referenceLineMinRightY:
            minReferenceLineRightY < minValueRightY
                ? minReferenceLineRightY
                : undefined,
        referenceLineMaxRightY:
            maxReferenceLineRightY > maxValueRightY
                ? maxReferenceLineRightY
                : undefined,
    };
};
type GetPivotSeriesArg = {
    series: Series;
    items: Array<Field | TableCalculation>;
    formats:
        | Record<string, Pick<CompiledField, 'format' | 'round' | 'compact'>>
        | undefined;
    cartesianChart: CartesianChart;
    flipAxes: boolean | undefined;
    yFieldHash: string;
    xFieldHash: string;
    pivotReference: Required<PivotReference>;
};

const getPivotSeries = ({
    series,
    pivotReference,
    items,
    xFieldHash,
    yFieldHash,
    flipAxes,
    formats,
    cartesianChart,
}: GetPivotSeriesArg): EChartSeries => {
    const pivotLabel = pivotReference.pivotValues.reduce(
        (acc, { field, value }) => {
            const formattedValue = getFormattedValue(value, field, items);
            return acc ? `${acc} - ${formattedValue}` : formattedValue;
        },
        '',
    );
    return {
        ...series,
        emphasis: {
            focus: 'series',
        },
        xAxisIndex: flipAxes ? series.yAxisIndex : undefined,
        yAxisIndex: flipAxes ? undefined : series.yAxisIndex,
        connectNulls: true,
        encode: {
            x: flipAxes ? yFieldHash : xFieldHash,
            y: flipAxes ? xFieldHash : yFieldHash,
            tooltip: [yFieldHash],
            seriesName: yFieldHash,
        },
        pivotReference,
        dimensions: [
            {
                name: xFieldHash,
                displayName: getLabelFromField(items, xFieldHash),
            },
            {
                name: yFieldHash,
                displayName:
                    cartesianChart.layout.yField &&
                    cartesianChart.layout.yField.length > 1
                        ? `[${pivotLabel}] ${getLabelFromField(
                              items,
                              series.encode.yRef.field,
                          )}`
                        : pivotLabel,
            },
        ],
        tooltip: {
            valueFormatter: valueFormatter(series.encode.yRef.field, items),
        },
        ...(series.label?.show && {
            label: {
                ...series.label,
                ...(formats &&
                    formats[series.encode.yRef.field] && {
                        formatter: (val: any) =>
                            formatValue(val?.value?.[yFieldHash], {
                                format: formats[series.encode.yRef.field]
                                    .format,
                                round: formats[series.encode.yRef.field].round,
                                compact:
                                    formats[series.encode.yRef.field].compact,
                            }),
                    }),
            },
            labelLayout: {
                hideOverlap: true,
            },
        }),
    };
};

type GetSimpleSeriesArg = {
    series: Series;
    items: Array<Field | TableCalculation>;
    formats:
        | Record<string, Pick<CompiledField, 'format' | 'round' | 'compact'>>
        | undefined;
    flipAxes: boolean | undefined;
    yFieldHash: string;
    xFieldHash: string;
};

const getSimpleSeries = ({
    series,
    flipAxes,
    yFieldHash,
    xFieldHash,
    items,
    formats,
}: GetSimpleSeriesArg) => ({
    ...series,
    xAxisIndex: flipAxes ? series.yAxisIndex : undefined,
    yAxisIndex: flipAxes ? undefined : series.yAxisIndex,
    emphasis: {
        focus: 'series',
    },
    connectNulls: true,
    encode: {
        ...series.encode,
        x: flipAxes ? yFieldHash : xFieldHash,
        y: flipAxes ? xFieldHash : yFieldHash,
        tooltip: [yFieldHash],
        seriesName: yFieldHash,
    },
    dimensions: [
        {
            name: xFieldHash,
            displayName: getLabelFromField(items, xFieldHash),
        },
        {
            name: yFieldHash,
            displayName: getLabelFromField(items, yFieldHash),
        },
    ],
    tooltip: {
        valueFormatter: valueFormatter(yFieldHash, items),
    },

    ...(series.label?.show && {
        label: {
            ...series.label,
            ...(formats &&
                formats[yFieldHash] && {
                    formatter: (value: any) =>
                        formatValue(value?.value?.[yFieldHash], {
                            format: formats[yFieldHash].format,
                            round: formats[yFieldHash].round,
                            compact: formats[yFieldHash].compact,
                        }),
                }),
        },
        labelLayout: {
            hideOverlap: true,
        },
    }),
});

export const getEchartsSeries = (
    items: Array<Field | TableCalculation>,
    originalData: ApiQueryResults['rows'],
    cartesianChart: CartesianChart,
    pivotKeys: string[] | undefined,
    formats:
        | Record<string, Pick<CompiledField, 'format' | 'round'>>
        | undefined,
): EChartSeries[] => {
    return (cartesianChart.eChartsConfig.series || [])
        .filter((s) => !s.hidden)
        .map<EChartSeries>((series) => {
            const { flipAxes } = cartesianChart.layout;
            const xFieldHash = hashFieldReference(series.encode.xRef);
            const yFieldHash = hashFieldReference(series.encode.yRef);
            if (pivotKeys && isPivotReferenceWithValues(series.encode.yRef)) {
                return getPivotSeries({
                    series,
                    items,
                    cartesianChart,
                    pivotReference: series.encode.yRef,
                    formats,
                    flipAxes,
                    xFieldHash,
                    yFieldHash,
                });
            }

            return getSimpleSeries({
                series,
                items,
                formats,
                flipAxes,
                yFieldHash,
                xFieldHash,
            });
        });
};

const calculateWidthText = (text: string | undefined): number => {
    if (!text) return 0;

    const span = document.createElement('span');
    document.body.appendChild(span);

    span.style.font = 'sans-serif';
    span.style.fontSize = '12px';
    span.style.height = 'auto';
    span.style.width = 'auto';
    span.style.top = '0px';
    span.style.position = 'absolute';
    span.style.whiteSpace = 'no-wrap';
    span.innerHTML = text;

    const width = Math.ceil(span.clientWidth);
    span.remove();
    return width;
};
const getEchartAxis = ({
    items,
    validCartesianConfig,
    series,
    resultsData,
}: {
    validCartesianConfig: CartesianChart;
    items: Array<Field | TableCalculation>;
    series: EChartSeries[];
    resultsData: ApiQueryResults | undefined;
}) => {
    const itemMap = items.reduce<Record<string, Field | TableCalculation>>(
        (acc, item) => ({
            ...acc,
            [getItemId(item)]: item,
        }),
        {},
    );
    const xAxisItemId = validCartesianConfig.layout.flipAxes
        ? validCartesianConfig.layout?.yField?.[0]
        : validCartesianConfig.layout?.xField;
    const xAxisItem = xAxisItemId ? itemMap[xAxisItemId] : undefined;

    const yAxisItemId = validCartesianConfig.layout.flipAxes
        ? validCartesianConfig.layout?.xField
        : validCartesianConfig.layout?.yField?.[0];

    const yAxisItem = yAxisItemId ? itemMap[yAxisItemId] : undefined;

    const selectedAxisInSeries = Array.from(
        new Set(
            series?.map(({ yAxisIndex, xAxisIndex }) =>
                validCartesianConfig.layout.flipAxes ? xAxisIndex : yAxisIndex,
            ),
        ),
    );
    const isAxisTheSameForAllSeries: boolean =
        selectedAxisInSeries.length === 1;
    const selectedAxisIndex = selectedAxisInSeries[0] || 0;

    const xAxisConfiguration = validCartesianConfig.layout.flipAxes
        ? validCartesianConfig.eChartsConfig?.yAxis
        : validCartesianConfig.eChartsConfig?.xAxis;
    const yAxisConfiguration = validCartesianConfig.layout.flipAxes
        ? validCartesianConfig.eChartsConfig?.xAxis
        : validCartesianConfig.eChartsConfig?.yAxis;

    const [allowFirstAxisDefaultRange, allowSecondAxisDefaultRange] = (
        series || []
    ).reduce<[boolean, boolean]>(
        (acc, singleSeries) => {
            if (singleSeries.type === CartesianSeriesType.BAR) {
                acc[singleSeries.yAxisIndex || 0] = false;
            }
            return acc;
        },
        [true, true],
    );

    const getAxisFormatter = (
        axisItem: Field | TableCalculation | undefined,
    ) => {
        const field =
            axisItem &&
            getItemId(axisItem) &&
            items.find((item) => getItemId(axisItem) === getItemId(item));
        const hasFormattingConfig =
            isField(field) && (field.format || field.round || field.compact);
        const axisMinInterval =
            isDimension(field) &&
            field.timeInterval &&
            isTimeInterval(field.timeInterval) &&
            timeFrameConfigs[field.timeInterval].getAxisMinInterval();
        const axisLabelFormatter =
            isDimension(field) &&
            field.timeInterval &&
            isTimeInterval(field.timeInterval) &&
            timeFrameConfigs[field.timeInterval].getAxisLabelFormatter();
        const axisConfig: Record<string, any> = {};

        if (field && (hasFormattingConfig || axisMinInterval)) {
            axisConfig.axisLabel = {
                formatter: (value: any) => {
                    return formatItemValue(field, value, true);
                },
            };
        } else if (axisLabelFormatter) {
            axisConfig.axisLabel = {
                formatter: axisLabelFormatter,
            };
        }
        if (axisMinInterval) {
            axisConfig.minInterval = axisMinInterval;
        }
        return axisConfig;
    };

    const showGridX = !!validCartesianConfig.layout.showGridX;
    const showGridY =
        validCartesianConfig.layout.showGridY !== undefined
            ? validCartesianConfig.layout.showGridY
            : true;

    // There is no Top x axis when no flipped
    const topAxisXId = validCartesianConfig.layout.flipAxes
        ? validCartesianConfig.eChartsConfig.series?.find(
              (serie) => serie.yAxisIndex === 1,
          )?.encode.yRef.field
        : undefined;
    const bottomAxisXId = validCartesianConfig.layout.flipAxes
        ? validCartesianConfig.eChartsConfig.series?.find(
              (serie) => serie.yAxisIndex === 0,
          )?.encode.yRef.field
        : xAxisItemId;

    const leftAxisYId = validCartesianConfig.layout.flipAxes
        ? validCartesianConfig.layout?.xField
        : validCartesianConfig.eChartsConfig.series?.find(
              (serie) => serie.yAxisIndex === 0,
          )?.encode.yRef.field || yAxisItemId;
    // There is no right Y axis when flipped
    const rightAxisYId =
        validCartesianConfig.eChartsConfig.series?.find(
            (serie) => serie.yAxisIndex === 1,
        )?.encode.yRef.field || validCartesianConfig.layout?.yField?.[1];

    const longestValueYAxisLeft: string | undefined =
        leftAxisYId &&
        resultsData?.rows
            .map((row) => row[leftAxisYId]?.value?.formatted)
            .reduce<string>(
                (acc, p) => (p && acc.length > p.length ? acc : p),
                '',
            );
    const leftYaxisGap = calculateWidthText(longestValueYAxisLeft);

    const longestValueYAxisRight: string | undefined =
        rightAxisYId &&
        resultsData?.rows
            .map((row) => row[rightAxisYId]?.value?.formatted)
            .reduce<string>(
                (acc, p) => (p && acc.length > p.length ? acc : p),
                '',
            );
    const rightYaxisGap = calculateWidthText(longestValueYAxisRight);

    const rightAxisYField = rightAxisYId ? itemMap[rightAxisYId] : undefined;
    const leftAxisYField = leftAxisYId ? itemMap[leftAxisYId] : undefined;
    const topAxisXField = topAxisXId ? itemMap[topAxisXId] : undefined;
    const bottomAxisXField = bottomAxisXId ? itemMap[bottomAxisXId] : undefined;

    const { bottomAxisType, topAxisType, rightAxisType, leftAxisType } =
        getAxisType({
            validCartesianConfig,
            itemMap,
            topAxisXId,
            bottomAxisXId,
            leftAxisYId,
            rightAxisYId,
        });

    const {
        referenceLineMinX,
        referenceLineMaxX,
        referenceLineMinLeftY,
        referenceLineMaxLeftY,
        referenceLineMinRightY,
        referenceLineMaxRightY,
    } = getMinAndMaxReferenceLines(
        leftAxisYId,
        rightAxisYId,
        bottomAxisXId,
        resultsData,
        validCartesianConfig.eChartsConfig.series,
        items,
    );

    return {
        xAxis: [
            {
                type: bottomAxisType,
                name: validCartesianConfig.layout.flipAxes
                    ? getAxisName({
                          isAxisTheSameForAllSeries,
                          selectedAxisIndex,
                          axisIndex: 0,
                          axisReference: 'yRef',
                          axisName: xAxisConfiguration?.[0]?.name,
                          items,
                          series: validCartesianConfig.eChartsConfig.series,
                      })
                    : xAxisConfiguration?.[0]?.name ||
                      (xAxisItem
                          ? getItemLabelWithoutTableName(xAxisItem)
                          : undefined),
                min: validCartesianConfig.layout.flipAxes
                    ? xAxisConfiguration?.[0]?.min ||
                      maybeGetAxisDefaultMinValue(allowFirstAxisDefaultRange)
                    : referenceLineMinX,
                max: validCartesianConfig.layout.flipAxes
                    ? xAxisConfiguration?.[0]?.max ||
                      maybeGetAxisDefaultMaxValue(allowFirstAxisDefaultRange)
                    : referenceLineMaxX,
                nameLocation: 'center',
                nameGap: 30,
                nameTextStyle: {
                    fontWeight: 'bold',
                },
                ...getAxisFormatter(bottomAxisXField),
                splitLine: {
                    show: validCartesianConfig.layout.flipAxes
                        ? showGridY
                        : showGridX,
                },
                inverse: !!xAxisConfiguration?.[0].inverse,
            },
            {
                type: topAxisType,
                name: validCartesianConfig.layout.flipAxes
                    ? getAxisName({
                          isAxisTheSameForAllSeries,
                          selectedAxisIndex,
                          axisIndex: 1,
                          axisReference: 'yRef',
                          axisName: xAxisConfiguration?.[1]?.name,
                          items,
                          series: validCartesianConfig.eChartsConfig.series,
                      })
                    : undefined,
                min: validCartesianConfig.layout.flipAxes
                    ? xAxisConfiguration?.[1]?.min ||
                      maybeGetAxisDefaultMinValue(allowSecondAxisDefaultRange)
                    : undefined,
                max: validCartesianConfig.layout.flipAxes
                    ? xAxisConfiguration?.[1]?.max ||
                      maybeGetAxisDefaultMaxValue(allowSecondAxisDefaultRange)
                    : undefined,
                nameLocation: 'center',
                nameGap: 30,
                ...getAxisFormatter(topAxisXField),

                nameTextStyle: {
                    fontWeight: 'bold',
                },
                splitLine: {
                    show: isAxisTheSameForAllSeries,
                },
            },
        ],
        yAxis: [
            {
                type: leftAxisType,
                name: validCartesianConfig.layout.flipAxes
                    ? yAxisConfiguration?.[0]?.name ||
                      (yAxisItem
                          ? getItemLabelWithoutTableName(yAxisItem)
                          : undefined)
                    : getAxisName({
                          isAxisTheSameForAllSeries,
                          selectedAxisIndex,
                          axisIndex: 0,
                          axisReference: 'yRef',
                          axisName: yAxisConfiguration?.[0]?.name,
                          items,
                          series: validCartesianConfig.eChartsConfig.series,
                      }),
                min: !validCartesianConfig.layout.flipAxes
                    ? yAxisConfiguration?.[0]?.min ||
                      referenceLineMinLeftY ||
                      maybeGetAxisDefaultMinValue(allowFirstAxisDefaultRange)
                    : undefined,
                max: !validCartesianConfig.layout.flipAxes
                    ? yAxisConfiguration?.[0]?.max ||
                      referenceLineMaxLeftY ||
                      maybeGetAxisDefaultMaxValue(allowFirstAxisDefaultRange)
                    : undefined,
                nameTextStyle: {
                    fontWeight: 'bold',
                    align: 'center',
                },
                nameLocation: 'center',
                nameGap: leftYaxisGap + 20,
                ...getAxisFormatter(leftAxisYField),
                splitLine: {
                    show: validCartesianConfig.layout.flipAxes
                        ? showGridX
                        : showGridY,
                },
                inverse: !!yAxisConfiguration?.[0].inverse,
            },
            {
                type: rightAxisType,
                name: validCartesianConfig.layout.flipAxes
                    ? yAxisConfiguration?.[1]?.name
                    : getAxisName({
                          isAxisTheSameForAllSeries,
                          selectedAxisIndex,
                          axisIndex: 1,
                          axisReference: 'yRef',
                          axisName: yAxisConfiguration?.[1]?.name,
                          items,
                          series: validCartesianConfig.eChartsConfig.series,
                      }),
                min: !validCartesianConfig.layout.flipAxes
                    ? yAxisConfiguration?.[1]?.min ||
                      referenceLineMinRightY ||
                      maybeGetAxisDefaultMinValue(allowSecondAxisDefaultRange)
                    : undefined,
                max: !validCartesianConfig.layout.flipAxes
                    ? yAxisConfiguration?.[1]?.max ||
                      referenceLineMaxRightY ||
                      maybeGetAxisDefaultMaxValue(allowSecondAxisDefaultRange)
                    : undefined,
                nameTextStyle: {
                    fontWeight: 'bold',
                    align: 'center',
                },
                ...getAxisFormatter(rightAxisYField),

                nameLocation: 'center',
                nameRotate: -90,
                nameGap: rightYaxisGap + 20,
                splitLine: {
                    show: isAxisTheSameForAllSeries,
                },
            },
        ],
    };
};

const getValidStack = (series: EChartSeries | undefined) => {
    return series && (series.type === 'bar' || !!series.areaStyle)
        ? series.stack
        : undefined;
};

const calculateStackTotal = (
    row: ResultRow,
    series: EChartSeries[],
    flipAxis: boolean | undefined,
) => {
    return series.reduce<number>((acc, s) => {
        const hash = flipAxis ? s.encode?.x : s.encode?.y;
        const numberValue = hash ? toNumber(row[hash]?.value.raw) : 0;
        if (!Number.isNaN(numberValue)) {
            acc += numberValue;
        }
        return acc;
    }, 0);
};

// Stack total row contains:
// - x/y axis value
// - the value 0 to be stacked (hack)
// - the total of that stack to be used in the label
// The x/axis value and the "0" need to flip position if the axis are flipped
const getStackTotalRows = (
    rows: ResultRow[],
    series: EChartSeries[],
    flipAxis: boolean | undefined,
): [unknown, unknown, number][] => {
    return rows.map((row) => {
        const total = calculateStackTotal(row, series, flipAxis);
        const hash = flipAxis ? series[0].encode?.y : series[0].encode?.x;
        if (!hash) {
            return [null, null, 0];
        }
        return flipAxis
            ? [0, row[hash]?.value.raw, total]
            : [row[hash]?.value.raw, 0, total];
    });
};

// To hack the stack totals in echarts we need to create a fake series with the value 0 and display the total in the label
const getStackTotalSeries = (
    rows: ResultRow[],
    seriesWithStack: EChartSeries[],
    items: Array<Field | TableCalculation>,
    flipAxis: boolean | undefined,
) => {
    const seriesGroupedByStack = groupBy(seriesWithStack, 'stack');
    return Object.entries(seriesGroupedByStack).reduce<EChartSeries[]>(
        (acc, [stack, series]) => {
            if (!stack || !series[0] || !series[0].stackLabel?.show) {
                return acc;
            }
            const stackSeries: EChartSeries = {
                type: series[0].type,
                connectNulls: true,
                stack: stack,
                label: {
                    show: series[0].stackLabel?.show,
                    formatter: (param) => {
                        const stackTotal = param.data[2];
                        const fieldId = series[0].pivotReference?.field;
                        if (fieldId) {
                            return getFormattedValue(
                                stackTotal,
                                fieldId,
                                items,
                            );
                        }
                        return '';
                    },
                    fontWeight: 'bold',
                    position: flipAxis ? 'right' : 'top',
                },
                labelLayout: {
                    hideOverlap: true,
                },
                tooltip: {
                    show: false,
                },
                data: getStackTotalRows(rows, series, flipAxis),
            };
            return [...acc, stackSeries];
        },
        [],
    );
};

const useEcharts = () => {
    const context = useVisualizationContext();
    const {
        cartesianConfig: { validCartesianConfig },
        explore,
        originalData,
        pivotDimensions,
        resultsData,
    } = context;
    const { data: organizationData } = useOrganization();

    const [pivotedKeys, nonPivotedKeys] = useMemo(() => {
        if (
            resultsData &&
            validCartesianConfig &&
            isCompleteLayout(validCartesianConfig.layout)
        ) {
            const yFieldPivotedKeys = validCartesianConfig.layout.yField.filter(
                (yField) =>
                    !resultsData.metricQuery.dimensions.includes(yField),
            );
            const yFieldNonPivotedKeys =
                validCartesianConfig.layout.yField.filter((yField) =>
                    resultsData.metricQuery.dimensions.includes(yField),
                );

            return [
                yFieldPivotedKeys,
                [...yFieldNonPivotedKeys, validCartesianConfig.layout.xField],
            ];
        }
        return [];
    }, [validCartesianConfig, resultsData]);

    const { rows } = usePlottedData(
        resultsData?.rows,
        pivotDimensions,
        pivotedKeys,
        nonPivotedKeys,
    );

    const formats = useMemo(
        () =>
            explore
                ? getFieldMap(
                      explore,
                      resultsData?.metricQuery.additionalMetrics,
                  )
                : undefined,
        [explore, resultsData],
    );

    const items = useMemo(() => {
        if (!explore || !resultsData) {
            return [];
        }
        return [
            ...getFields(explore),
            ...(resultsData?.metricQuery.additionalMetrics || []).reduce<
                Metric[]
            >((acc, additionalMetric) => {
                const table = explore.tables[additionalMetric.table];
                if (table) {
                    const metric = convertAdditionalMetric({
                        additionalMetric,
                        table,
                    });
                    return [...acc, metric];
                }
                return acc;
            }, []),
            ...(resultsData?.metricQuery.tableCalculations || []),
        ];
    }, [explore, resultsData]);

    const series = useMemo(() => {
        if (!explore || !validCartesianConfig || !resultsData) {
            return [];
        }

        return getEchartsSeries(
            items,
            originalData,
            validCartesianConfig,
            pivotDimensions,
            formats,
        );
    }, [
        explore,
        validCartesianConfig,
        resultsData,
        pivotDimensions,
        originalData,
        formats,
        items,
    ]);

    const axis = useMemo(() => {
        if (!validCartesianConfig) {
            return { xAxis: [], yAxis: [] };
        }

        return getEchartAxis({
            items,
            series,
            validCartesianConfig,
            resultsData,
        });
    }, [items, series, validCartesianConfig, resultsData]);

    const stackedSeries = useMemo(() => {
        const seriesWithValidStack = series.map<EChartSeries>((serie) => ({
            ...serie,
            stack: getValidStack(serie),
        }));
        return [
            ...seriesWithValidStack,
            ...getStackTotalSeries(
                rows,
                seriesWithValidStack,
                items,
                validCartesianConfig?.layout.flipAxes,
            ),
        ];
    }, [series, rows, items, validCartesianConfig?.layout.flipAxes]);

    const colors = useMemo<string[]>(() => {
        const allColors =
            organizationData?.chartColors || ECHARTS_DEFAULT_COLORS;
        //Do not use colors from hidden series
        return validCartesianConfig?.eChartsConfig.series
            ? validCartesianConfig.eChartsConfig.series.reduce<string[]>(
                  (acc, serie, index) => {
                      if (!serie.hidden)
                          return [
                              ...acc,
                              allColors[index] || getDefaultSeriesColor(index),
                          ];
                      else return acc;
                  },
                  [],
              )
            : allColors;
    }, [organizationData?.chartColors, validCartesianConfig]);

    const eChartsOptions = useMemo(
        () => ({
            xAxis: axis.xAxis,
            yAxis: axis.yAxis,
            useUTC: true,
            series: stackedSeries,
            legend: removeEmptyProperties(
                validCartesianConfig?.eChartsConfig.legend,
            ) || {
                show: series.length > 1,
                type: 'scroll',
            },
            dataset: {
                id: 'lightdashResults',
                source:
                    validCartesianConfig?.layout?.xField === EMPTY_X_AXIS
                        ? getResultValues(rows, true).map((s) => ({
                              ...s,
                              [EMPTY_X_AXIS]: ' ',
                          }))
                        : getResultValues(rows, true),
            },
            tooltip: {
                show: true,
                confine: true,
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow',
                    label: { show: true },
                },
            },
            grid: {
                ...defaultGrid,
                ...removeEmptyProperties(
                    validCartesianConfig?.eChartsConfig.grid,
                ),
            },
            color: colors,
        }),
        [axis, colors, rows, series, stackedSeries, validCartesianConfig],
    );
    if (
        !explore ||
        series.length <= 0 ||
        rows.length <= 0 ||
        !validCartesianConfig
    ) {
        return undefined;
    }
    return eChartsOptions;
};

export default useEcharts;
