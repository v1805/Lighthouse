import {
    AnchorButton,
    Button,
    Classes,
    Dialog,
    FormGroup,
    Intent,
} from '@blueprintjs/core';
import {
    ChartType,
    CompiledDimension,
    CreateSavedChartVersion,
    DashboardFilters,
    FieldId,
    fieldId as getFieldId,
    FilterGroupItem,
    FilterOperator,
    FilterRule,
    Filters,
    getDimensions,
    getItemId,
    hashFieldReference,
    isField,
    MetricQuery,
    PivotReference,
    ResultRow,
} from '@lightdash/common';
import React, { FC, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { getExplorerUrlFromCreateSavedChartVersion } from '../../hooks/useExplorerRoute';
import FieldAutoComplete from '../common/Filters/FieldAutoComplete';
import {
    UnderlyingValueMap,
    useMetricQueryDataContext,
} from './MetricQueryDataProvider';

type CombineFiltersArgs = {
    fieldValues: UnderlyingValueMap;
    metricQuery: MetricQuery;
    pivotReference?: PivotReference;
    dashboardFilters?: DashboardFilters;
    extraFilters?: Filters;
};
const combineFilters = ({
    fieldValues,
    metricQuery,
    pivotReference,
    dashboardFilters,
    extraFilters,
}: CombineFiltersArgs): Filters => {
    const combinedDimensionFilters: Array<FilterGroupItem> = [];

    if (metricQuery.filters.dimensions) {
        combinedDimensionFilters.push(metricQuery.filters.dimensions);
    }
    if (dashboardFilters) {
        combinedDimensionFilters.push(...dashboardFilters.dimensions);
    }
    if (pivotReference?.pivotValues) {
        const pivotFilter: FilterRule[] = pivotReference.pivotValues.map(
            (pivot) => ({
                id: uuidv4(),
                target: {
                    fieldId: pivot.field,
                },
                operator: FilterOperator.EQUALS,
                values: [pivot.value],
            }),
        );
        combinedDimensionFilters.push(...pivotFilter);
    }
    if (extraFilters?.dimensions) {
        combinedDimensionFilters.push(extraFilters.dimensions);
    }

    const dimensionFilters: FilterRule[] = metricQuery.dimensions.reduce<
        FilterRule[]
    >((acc, dimension) => {
        const rowValue = fieldValues[dimension];
        if (!rowValue) {
            return acc;
        }
        const dimensionFilter: FilterRule = {
            id: uuidv4(),
            target: {
                fieldId: dimension,
            },
            operator:
                rowValue.raw === null
                    ? FilterOperator.NULL
                    : FilterOperator.EQUALS,
            values: rowValue.raw === null ? undefined : [rowValue.raw],
        };
        return [...acc, dimensionFilter];
    }, []);
    combinedDimensionFilters.push(...dimensionFilters);

    return {
        dimensions: {
            id: uuidv4(),
            and: combinedDimensionFilters,
        },
    };
};

type DrillDownExploreUrlArgs = {
    fieldValues: UnderlyingValueMap;
    projectUuid: string;
    tableName: string;
    metricQuery: MetricQuery;
    drillByMetric: FieldId;
    drillByDimension: FieldId;
    dashboardFilters?: DashboardFilters;
    extraFilters?: Filters;
    pivotReference?: PivotReference;
};

const drillDownExploreUrl = ({
    fieldValues,
    projectUuid,
    tableName,
    metricQuery,
    drillByMetric,
    drillByDimension,
    dashboardFilters,
    extraFilters,
    pivotReference,
}: DrillDownExploreUrlArgs) => {
    const createSavedChartVersion: CreateSavedChartVersion = {
        tableName,
        metricQuery: {
            tableCalculations: [],
            dimensions: [drillByDimension],
            metrics: [drillByMetric],
            filters: combineFilters({
                metricQuery,
                fieldValues,
                dashboardFilters,
                extraFilters,
                pivotReference,
            }),
            limit: 500,
            additionalMetrics: metricQuery.additionalMetrics,
            sorts: [{ fieldId: drillByDimension, descending: false }],
        },
        pivotConfig: undefined,
        tableConfig: {
            columnOrder: [],
        },
        chartConfig: {
            type: ChartType.CARTESIAN,
            config: { layout: {}, eChartsConfig: {} },
        },
    };
    const { pathname, search } = getExplorerUrlFromCreateSavedChartVersion(
        projectUuid,
        createSavedChartVersion,
    );
    return `${pathname}?${search}`;
};
const DrillDownModal: FC = () => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const [selectedDimension, setSelectedDimension] =
        React.useState<CompiledDimension>();
    const {
        isDrillDownModalOpen,
        closeDrillDownModal,
        explore,
        metricQuery,
        drillDownConfig,
    } = useMetricQueryDataContext();

    const dimensionsAvailable = useMemo(() => {
        if (explore) {
            return getDimensions(explore).filter(
                (dimension) => !dimension.hidden,
            );
        }
        return [];
    }, [explore]);
    const value = useMemo(() => {
        if (drillDownConfig && isField(drillDownConfig.item)) {
            const fieldId =
                drillDownConfig.pivotReference !== undefined
                    ? hashFieldReference(drillDownConfig.pivotReference)
                    : getFieldId(drillDownConfig.item);
            return drillDownConfig.fieldValues[fieldId]?.formatted;
        }
    }, [drillDownConfig]);

    const url = useMemo(() => {
        if (selectedDimension && metricQuery && explore && drillDownConfig) {
            return drillDownExploreUrl({
                projectUuid,
                tableName: explore.name,
                metricQuery,
                fieldValues: drillDownConfig.fieldValues,
                drillByMetric: getItemId(drillDownConfig.item),
                drillByDimension: getItemId(selectedDimension),
                dashboardFilters: drillDownConfig.dashboardFilters,
                pivotReference: drillDownConfig.pivotReference,
            });
        }
    }, [selectedDimension, metricQuery, explore, drillDownConfig, projectUuid]);

    const onClose = useCallback(() => {
        setSelectedDimension(undefined);
        closeDrillDownModal();
    }, [closeDrillDownModal]);
    return (
        <Dialog
            isOpen={isDrillDownModalOpen}
            onClose={closeDrillDownModal}
            lazy
            title={`Drill into "${value}"`}
        >
            <form>
                <div className={Classes.DIALOG_BODY}>
                    <FormGroup
                        label="Pick a dimension to segment your metric by"
                        labelFor="chart-name"
                    >
                        <FieldAutoComplete
                            activeField={selectedDimension}
                            fields={dimensionsAvailable}
                            onChange={(field) => {
                                if (isField(field)) {
                                    setSelectedDimension(field);
                                }
                            }}
                            disabled={dimensionsAvailable.length === 0}
                        />
                    </FormGroup>
                </div>
                <div className={Classes.DIALOG_FOOTER}>
                    <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <Button onClick={onClose}>Cancel</Button>
                        <AnchorButton
                            text="Open in new tab"
                            href={url}
                            target={'_blank'}
                            disabled={!selectedDimension}
                            onClick={onClose}
                            intent={Intent.PRIMARY}
                            type="submit"
                        />
                    </div>
                </div>
            </form>
        </Dialog>
    );
};

export default DrillDownModal;
