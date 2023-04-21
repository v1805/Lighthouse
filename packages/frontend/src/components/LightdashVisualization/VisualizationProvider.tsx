import {
    ApiQueryResults,
    ChartConfig,
    ChartType,
    Explore,
} from '@lightdash/common';
import EChartsReact from 'echarts-for-react';
import React, {
    createContext,
    FC,
    RefObject,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import useCartesianChartConfig from '../../hooks/cartesianChartConfig/useCartesianChartConfig';
import { EChartSeries } from '../../hooks/echarts/useEcharts';
import useTableConfig from '../../hooks/tableVisualization/useTableConfig';
import useBigNumberConfig from '../../hooks/useBigNumberConfig';
import usePivotDimensions from '../../hooks/usePivotDimensions';
import { EchartSeriesClickEvent } from '../SimpleChart';

type VisualizationContext = {
    minimal: boolean;
    chartRef: RefObject<EChartsReact>;
    chartType: ChartType;
    cartesianConfig: ReturnType<typeof useCartesianChartConfig>;
    bigNumberConfig: ReturnType<typeof useBigNumberConfig>;
    tableConfig: ReturnType<typeof useTableConfig>;
    pivotDimensions: string[] | undefined;
    explore: Explore | undefined;
    originalData: ApiQueryResults['rows'];
    resultsData: ApiQueryResults | undefined;
    isLoading: boolean;
    columnOrder: string[];
    isSqlRunner: boolean;
    onSeriesContextMenu?: (
        e: EchartSeriesClickEvent,
        series: EChartSeries[],
    ) => void;
    setChartType: (value: ChartType) => void;
    setPivotDimensions: (value: string[] | undefined) => void;
};

const Context = createContext<VisualizationContext | undefined>(undefined);

type Props = {
    minimal?: boolean;
    chartType: ChartType;
    initialChartConfig: ChartConfig | undefined;
    initialPivotDimensions: string[] | undefined;
    resultsData: ApiQueryResults | undefined;
    isLoading: boolean;
    columnOrder: string[];
    onSeriesContextMenu?: (
        e: EchartSeriesClickEvent,
        series: EChartSeries[],
    ) => void;
    onChartConfigChange?: (value: ChartConfig['config']) => void;
    onChartTypeChange?: (value: ChartType) => void;
    onPivotDimensionsChange?: (value: string[] | undefined) => void;
    explore: Explore | undefined;
};

export const VisualizationProvider: FC<Props> = ({
    minimal = false,
    initialChartConfig,
    chartType,
    initialPivotDimensions,
    resultsData,
    isLoading,
    columnOrder,
    onSeriesContextMenu,
    onChartConfigChange,
    onChartTypeChange,
    onPivotDimensionsChange,
    explore,
    children,
}) => {
    const chartRef = useRef<EChartsReact>(null);

    const [lastValidResultsData, setLastValidResultsData] =
        useState<ApiQueryResults>();
    useEffect(() => {
        if (!!resultsData) {
            setLastValidResultsData(resultsData);
        }
    }, [resultsData]);

    const { validPivotDimensions, setPivotDimensions } = usePivotDimensions(
        initialPivotDimensions,
        lastValidResultsData,
    );
    const setChartType = useCallback(
        (value: ChartType) => {
            onChartTypeChange?.(value);
        },
        [onChartTypeChange],
    );

    const bigNumberConfig = useBigNumberConfig(
        initialChartConfig?.type === ChartType.BIG_NUMBER
            ? initialChartConfig.config
            : undefined,
        lastValidResultsData,
        explore,
    );

    // If we don't toggle any fields, (eg: when you `explore from here`) columnOrder on tableConfig might be empty
    // so we initialize it with the fields from resultData
    const defaultColumnOrder = useMemo(() => {
        if (columnOrder.length > 0) {
            return columnOrder;
        } else {
            const metricQuery = resultsData?.metricQuery;
            const metricQueryFields =
                metricQuery !== undefined
                    ? [
                          ...metricQuery.dimensions,
                          ...metricQuery.metrics,
                          ...metricQuery.tableCalculations.map(
                              ({ name }) => name,
                          ),
                      ]
                    : [];
            return metricQueryFields;
        }
    }, [resultsData?.metricQuery, columnOrder]);

    const tableConfig = useTableConfig(
        initialChartConfig?.type === ChartType.TABLE
            ? initialChartConfig.config
            : undefined,
        lastValidResultsData,
        explore,
        (columnOrder = defaultColumnOrder),
        validPivotDimensions,
    );

    const { validBigNumberConfig } = bigNumberConfig;
    const { validTableConfig } = tableConfig;

    const isSqlRunner = useMemo(() => {
        return explore?.name === 'sql_runner';
    }, [explore?.name]);

    const cartesianConfig = useCartesianChartConfig({
        chartType,
        initialChartConfig:
            initialChartConfig?.type === ChartType.CARTESIAN
                ? initialChartConfig.config
                : undefined,
        pivotKeys: validPivotDimensions,
        resultsData: lastValidResultsData,
        setPivotDimensions,
        columnOrder: isSqlRunner ? [] : defaultColumnOrder,
        explore: isSqlRunner ? undefined : explore,
    });

    const { validCartesianConfig } = cartesianConfig;

    useEffect(() => {
        let validConfig: ChartConfig['config'];
        switch (chartType) {
            case ChartType.CARTESIAN:
                validConfig = validCartesianConfig;
                break;
            case ChartType.BIG_NUMBER:
                validConfig = validBigNumberConfig;
                break;
            case ChartType.TABLE:
                validConfig = validTableConfig;
                break;
            default:
                const never: never = chartType;
                throw new Error(`Unexpected chart type: ${chartType}`);
        }
        onChartConfigChange?.(validConfig);
    }, [
        validCartesianConfig,
        onChartConfigChange,
        chartType,
        validBigNumberConfig,
        validTableConfig,
    ]);

    useEffect(() => {
        onPivotDimensionsChange?.(validPivotDimensions);
    }, [validPivotDimensions, onPivotDimensionsChange]);

    const value = useMemo(
        () => ({
            minimal,
            pivotDimensions: validPivotDimensions,
            cartesianConfig,
            bigNumberConfig,
            tableConfig,
            chartRef,
            chartType,
            explore,
            originalData: lastValidResultsData?.rows || [],
            resultsData: lastValidResultsData,
            isLoading,
            columnOrder,
            isSqlRunner,
            onSeriesContextMenu,
            setChartType,
            setPivotDimensions,
        }),
        [
            minimal,
            bigNumberConfig,
            cartesianConfig,
            chartType,
            columnOrder,
            explore,
            isLoading,
            isSqlRunner,
            lastValidResultsData,
            onSeriesContextMenu,
            setChartType,
            setPivotDimensions,
            tableConfig,
            validPivotDimensions,
        ],
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
};

export function useVisualizationContext(): VisualizationContext {
    const context = useContext(Context);
    if (context === undefined) {
        throw new Error(
            'useVisualizationContext must be used within a VisualizationProvider',
        );
    }
    return context;
}

export default VisualizationProvider;
