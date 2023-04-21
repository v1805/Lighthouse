import {
    AdditionalMetric,
    assertUnreachable,
    ChartConfig,
    ChartType,
    CreateSavedChartVersion,
    deepEqual,
    FieldId,
    fieldId as getFieldId,
    isBigNumberConfig,
    isCartesianChartConfig,
    isTableChartConfig,
    MetricQuery,
    removeEmptyProperties,
    SavedChart,
    SortField,
    TableCalculation,
    toggleArrayValue,
} from '@lightdash/common';
import produce from 'immer';
import cloneDeep from 'lodash-es/cloneDeep';
import isEqual from 'lodash-es/isEqual';
import { FC, useCallback, useEffect, useMemo, useReducer } from 'react';
import {
    createContext,
    useContext,
    useContextSelector,
} from 'use-context-selector';
import useDefaultSortField from '../hooks/useDefaultSortField';
import { useQueryResults } from '../hooks/useQueryResults';

export enum ExplorerSection {
    FILTERS = 'FILTERS',
    VISUALIZATION = 'VISUALIZATION',
    RESULTS = 'RESULTS',
    SQL = 'SQL',
}

interface SwapSortFieldsPayload {
    sourceIndex: number;
    destinationIndex: number;
}

export enum ActionType {
    RESET,
    SET_TABLE_NAME,
    REMOVE_FIELD,
    TOGGLE_DIMENSION,
    TOGGLE_METRIC,
    TOGGLE_SORT_FIELD,
    SET_SORT_FIELDS,
    ADD_SORT_FIELD,
    REMOVE_SORT_FIELD,
    MOVE_SORT_FIELDS,
    SET_ROW_LIMIT,
    SET_FILTERS,
    SET_COLUMN_ORDER,
    ADD_TABLE_CALCULATION,
    UPDATE_TABLE_CALCULATION,
    DELETE_TABLE_CALCULATION,
    SET_FETCH_RESULTS_FALSE,
    SET_PREVIOUSLY_FETCHED_STATE,
    ADD_ADDITIONAL_METRIC,
    REMOVE_ADDITIONAL_METRIC,
    SET_PIVOT_FIELDS,
    SET_CHART_TYPE,
    SET_CHART_CONFIG,
    TOGGLE_EXPANDED_SECTION,
}

type Action =
    | { type: ActionType.RESET; payload: ExplorerReduceState }
    | { type: ActionType.SET_FETCH_RESULTS_FALSE }
    | {
          type: ActionType.SET_PREVIOUSLY_FETCHED_STATE;
          payload: MetricQuery;
      }
    | { type: ActionType.SET_TABLE_NAME; payload: string }
    | { type: ActionType.TOGGLE_EXPANDED_SECTION; payload: ExplorerSection }
    | {
          type:
              | ActionType.REMOVE_FIELD
              | ActionType.TOGGLE_DIMENSION
              | ActionType.TOGGLE_METRIC
              | ActionType.TOGGLE_SORT_FIELD;
          payload: FieldId;
      }
    | {
          type: ActionType.SET_SORT_FIELDS;
          payload: SortField[];
      }
    | {
          type: ActionType.ADD_SORT_FIELD;
          payload: SortField;
      }
    | {
          type: ActionType.REMOVE_SORT_FIELD;
          payload: FieldId;
      }
    | {
          type: ActionType.MOVE_SORT_FIELDS;
          payload: SwapSortFieldsPayload;
      }
    | {
          type: ActionType.SET_ROW_LIMIT;
          payload: number;
      }
    | {
          type: ActionType.SET_FILTERS;
          payload: MetricQuery['filters'];
      }
    | {
          type: ActionType.ADD_TABLE_CALCULATION;
          payload: TableCalculation;
      }
    | {
          type: ActionType.UPDATE_TABLE_CALCULATION;
          payload: { oldName: string; tableCalculation: TableCalculation };
      }
    | {
          type: ActionType.DELETE_TABLE_CALCULATION;
          payload: string;
      }
    | {
          type: ActionType.SET_COLUMN_ORDER;
          payload: string[];
      }
    | {
          type: ActionType.ADD_ADDITIONAL_METRIC;
          payload: AdditionalMetric;
      }
    | {
          type: ActionType.REMOVE_ADDITIONAL_METRIC;
          payload: FieldId;
      }
    | {
          type: ActionType.SET_PIVOT_FIELDS;
          payload: FieldId[];
      }
    | {
          type: ActionType.SET_CHART_TYPE;
          payload: ChartType;
      }
    | {
          type: ActionType.SET_CHART_CONFIG;
          payload: ChartConfig['config'] | undefined;
      };

export interface ExplorerReduceState {
    shouldFetchResults: boolean;
    expandedSections: ExplorerSection[];
    unsavedChartVersion: CreateSavedChartVersion;
    previouslyFetchedState?: MetricQuery;
}

export interface ExplorerState extends ExplorerReduceState {
    activeFields: Set<FieldId>;
    isValidQuery: boolean;
    hasUnsavedChanges: boolean;
    isEditMode: boolean;
    savedChart: SavedChart | undefined;
}

export interface ExplorerContext {
    state: ExplorerState;
    queryResults: ReturnType<typeof useQueryResults>;
    hasUnfetchedChanges: boolean;
    actions: {
        clear: () => void;
        reset: () => void;
        setTableName: (tableName: string) => void;
        removeActiveField: (fieldId: FieldId) => void;
        toggleActiveField: (fieldId: FieldId, isDimension: boolean) => void;
        toggleSortField: (fieldId: FieldId) => void;
        setSortFields: (sortFields: SortField[]) => void;
        addSortField: (
            fieldId: FieldId,
            options?: { descending: boolean },
        ) => void;
        removeSortField: (fieldId: FieldId) => void;
        moveSortFields: (sourceIndex: number, destinationIndex: number) => void;
        setRowLimit: (limit: number) => void;
        setFilters: (
            filters: MetricQuery['filters'],
            syncPristineState: boolean,
        ) => void;
        addAdditionalMetric: (metric: AdditionalMetric) => void;
        removeAdditionalMetric: (key: FieldId) => void;
        setColumnOrder: (order: string[]) => void;
        addTableCalculation: (tableCalculation: TableCalculation) => void;
        updateTableCalculation: (
            oldName: string,
            tableCalculation: TableCalculation,
        ) => void;
        deleteTableCalculation: (name: string) => void;
        setPivotFields: (fields: FieldId[] | undefined) => void;
        setChartType: (chartType: ChartType) => void;
        setChartConfig: (
            chartConfig: ChartConfig['config'] | undefined,
        ) => void;
        fetchResults: () => void;
        toggleExpandedSection: (section: ExplorerSection) => void;
    };
}

const Context = createContext<ExplorerContext | undefined>(undefined);

const defaultState: ExplorerReduceState = {
    shouldFetchResults: false,
    previouslyFetchedState: undefined,
    expandedSections: [ExplorerSection.RESULTS],
    unsavedChartVersion: {
        tableName: '',
        metricQuery: {
            dimensions: [],
            metrics: [],
            filters: {},
            sorts: [],
            limit: 500,
            tableCalculations: [],
            additionalMetrics: [],
        },
        pivotConfig: undefined,
        tableConfig: {
            columnOrder: [],
        },
        chartConfig: {
            type: ChartType.CARTESIAN,
            config: { layout: {}, eChartsConfig: {} },
        },
    },
};

export const getValidChartConfig = (
    type: ChartType,
    config: ChartConfig['config'],
): ChartConfig => {
    switch (type) {
        case ChartType.CARTESIAN: {
            return {
                type,
                config: isCartesianChartConfig(config)
                    ? config
                    : { layout: {}, eChartsConfig: {} },
            };
        }
        case ChartType.BIG_NUMBER: {
            return {
                type,
                config: isBigNumberConfig(config) ? config : {},
            };
        }
        case ChartType.TABLE: {
            return {
                type,
                config: isTableChartConfig(config) ? config : {},
            };
        }
    }
};

const calcColumnOrder = (
    columnOrder: FieldId[],
    fieldIds: FieldId[],
    dimensions?: FieldId[],
): FieldId[] => {
    const cleanColumnOrder = columnOrder.filter((column) =>
        fieldIds.includes(column),
    );
    const missingColumns = fieldIds.filter(
        (fieldId) => !cleanColumnOrder.includes(fieldId),
    );
    if (dimensions !== undefined) {
        const positionDimensionColumn = Math.max(
            ...dimensions.map((d) => cleanColumnOrder.indexOf(d)),
        );
        cleanColumnOrder.splice(
            positionDimensionColumn + 1,
            0,
            ...missingColumns,
        );
        return cleanColumnOrder;
    } else {
        return [...cleanColumnOrder, ...missingColumns];
    }
};

function reducer(
    state: ExplorerReduceState,
    action: Action & { options?: { shouldFetchResults: boolean } },
): ExplorerReduceState {
    state = {
        ...state,
        shouldFetchResults:
            action.options?.shouldFetchResults || state.shouldFetchResults,
    };
    switch (action.type) {
        case ActionType.RESET: {
            return action.payload;
        }
        case ActionType.SET_TABLE_NAME: {
            return {
                ...state,
                unsavedChartVersion: {
                    ...state.unsavedChartVersion,
                    tableName: action.payload,
                },
            };
        }
        case ActionType.SET_FETCH_RESULTS_FALSE: {
            return { ...state, shouldFetchResults: false };
        }
        case ActionType.SET_PREVIOUSLY_FETCHED_STATE: {
            return {
                ...state,
                previouslyFetchedState: action.payload,
            };
        }
        case ActionType.TOGGLE_EXPANDED_SECTION: {
            return {
                ...state,
                expandedSections: toggleArrayValue(
                    state.expandedSections,
                    action.payload,
                ),
            };
        }
        case ActionType.REMOVE_FIELD: {
            const dimensions =
                state.unsavedChartVersion.metricQuery.dimensions.filter(
                    (fieldId) => fieldId !== action.payload,
                );
            const metrics =
                state.unsavedChartVersion.metricQuery.metrics.filter(
                    (fieldId) => fieldId !== action.payload,
                );
            return {
                ...state,
                unsavedChartVersion: {
                    ...state.unsavedChartVersion,
                    metricQuery: {
                        ...state.unsavedChartVersion.metricQuery,
                        dimensions,
                        metrics,
                        sorts: state.unsavedChartVersion.metricQuery.sorts.filter(
                            (s) => s.fieldId !== action.payload,
                        ),
                    },
                    tableConfig: {
                        ...state.unsavedChartVersion.tableConfig,
                        columnOrder:
                            state.unsavedChartVersion.tableConfig.columnOrder.filter(
                                (fieldId) => fieldId !== action.payload,
                            ),
                    },
                },
            };
        }
        case ActionType.TOGGLE_DIMENSION: {
            const dimensions = toggleArrayValue(
                state.unsavedChartVersion.metricQuery.dimensions,
                action.payload,
            );
            return {
                ...state,
                unsavedChartVersion: {
                    ...state.unsavedChartVersion,
                    metricQuery: {
                        ...state.unsavedChartVersion.metricQuery,
                        dimensions,
                        sorts: state.unsavedChartVersion.metricQuery.sorts.filter(
                            (s) => s.fieldId !== action.payload,
                        ),
                    },
                    tableConfig: {
                        ...state.unsavedChartVersion.tableConfig,
                        columnOrder: calcColumnOrder(
                            state.unsavedChartVersion.tableConfig.columnOrder,
                            [
                                ...dimensions,
                                ...state.unsavedChartVersion.metricQuery
                                    .metrics,
                                ...state.unsavedChartVersion.metricQuery.tableCalculations.map(
                                    ({ name }) => name,
                                ),
                            ],
                            dimensions,
                        ),
                    },
                },
            };
        }
        case ActionType.TOGGLE_METRIC: {
            const metrics = toggleArrayValue(
                state.unsavedChartVersion.metricQuery.metrics,
                action.payload,
            );
            return {
                ...state,
                unsavedChartVersion: {
                    ...state.unsavedChartVersion,
                    metricQuery: {
                        ...state.unsavedChartVersion.metricQuery,
                        metrics,
                        sorts: state.unsavedChartVersion.metricQuery.sorts.filter(
                            (s) => s.fieldId !== action.payload,
                        ),
                    },
                    tableConfig: {
                        ...state.unsavedChartVersion.tableConfig,
                        columnOrder: calcColumnOrder(
                            state.unsavedChartVersion.tableConfig.columnOrder,
                            [
                                ...state.unsavedChartVersion.metricQuery
                                    .dimensions,
                                ...metrics,
                                ...state.unsavedChartVersion.metricQuery.tableCalculations.map(
                                    ({ name }) => name,
                                ),
                            ],
                        ),
                    },
                },
            };
        }
        case ActionType.TOGGLE_SORT_FIELD: {
            const sortFieldId = action.payload;
            const activeFields = new Set([
                ...state.unsavedChartVersion.metricQuery.dimensions,
                ...state.unsavedChartVersion.metricQuery.metrics,
                ...state.unsavedChartVersion.metricQuery.tableCalculations.map(
                    (tc) => tc.name,
                ),
            ]);
            if (!activeFields.has(sortFieldId)) {
                return state;
            }
            const sortField = state.unsavedChartVersion.metricQuery.sorts.find(
                (sf) => sf.fieldId === sortFieldId,
            );
            return {
                ...state,
                unsavedChartVersion: {
                    ...state.unsavedChartVersion,
                    metricQuery: {
                        ...state.unsavedChartVersion.metricQuery,
                        sorts: !sortField
                            ? [
                                  ...state.unsavedChartVersion.metricQuery
                                      .sorts,
                                  {
                                      fieldId: sortFieldId,
                                      descending: false,
                                  },
                              ]
                            : state.unsavedChartVersion.metricQuery.sorts.reduce<
                                  SortField[]
                              >((acc, sf) => {
                                  if (sf.fieldId !== sortFieldId) {
                                      return [...acc, sf];
                                  }

                                  if (sf.descending) {
                                      return acc;
                                  }
                                  return [
                                      ...acc,
                                      {
                                          ...sf,
                                          descending: true,
                                      },
                                  ];
                              }, []),
                    },
                },
            };
        }
        case ActionType.SET_SORT_FIELDS: {
            const activeFields = new Set([
                ...state.unsavedChartVersion.metricQuery.dimensions,
                ...state.unsavedChartVersion.metricQuery.metrics,
                ...state.unsavedChartVersion.metricQuery.tableCalculations.map(
                    (tc) => tc.name,
                ),
            ]);
            return {
                ...state,
                unsavedChartVersion: {
                    ...state.unsavedChartVersion,
                    metricQuery: {
                        ...state.unsavedChartVersion.metricQuery,
                        sorts: action.payload.filter((sf) =>
                            activeFields.has(sf.fieldId),
                        ),
                    },
                },
            };
        }
        case ActionType.ADD_SORT_FIELD: {
            return produce(state, (newState) => {
                const sort =
                    newState.unsavedChartVersion.metricQuery.sorts.find(
                        (sf) => sf.fieldId === action.payload.fieldId,
                    );

                if (sort) {
                    sort.descending = action.payload.descending;
                } else {
                    newState.unsavedChartVersion.metricQuery.sorts.push(
                        action.payload,
                    );
                }
            });
        }
        case ActionType.REMOVE_SORT_FIELD: {
            return produce(state, (newState) => {
                newState.unsavedChartVersion.metricQuery.sorts =
                    newState.unsavedChartVersion.metricQuery.sorts.filter(
                        (sf) => sf.fieldId !== action.payload,
                    );
            });
        }
        case ActionType.MOVE_SORT_FIELDS: {
            return produce(state, (newState) => {
                const sorts = newState.unsavedChartVersion.metricQuery.sorts;
                const { sourceIndex, destinationIndex } = action.payload;

                const [removed] = sorts.splice(sourceIndex, 1);
                sorts.splice(destinationIndex, 0, removed);
            });
        }
        case ActionType.SET_ROW_LIMIT: {
            return {
                ...state,
                unsavedChartVersion: {
                    ...state.unsavedChartVersion,
                    metricQuery: {
                        ...state.unsavedChartVersion.metricQuery,
                        limit: action.payload,
                    },
                },
            };
        }
        case ActionType.SET_FILTERS: {
            return {
                ...state,
                unsavedChartVersion: {
                    ...state.unsavedChartVersion,
                    metricQuery: {
                        ...state.unsavedChartVersion.metricQuery,
                        filters: action.payload,
                    },
                },
            };
        }
        case ActionType.ADD_ADDITIONAL_METRIC: {
            const isMetricAlreadyInList = (
                state.unsavedChartVersion.metricQuery.additionalMetrics || []
            ).find(
                (metric) => getFieldId(metric) === getFieldId(action.payload),
            );
            return {
                ...state,
                unsavedChartVersion: {
                    ...state.unsavedChartVersion,
                    metricQuery: {
                        ...state.unsavedChartVersion.metricQuery,
                        additionalMetrics: isMetricAlreadyInList
                            ? state.unsavedChartVersion.metricQuery
                                  .additionalMetrics
                            : [
                                  ...(state.unsavedChartVersion.metricQuery
                                      .additionalMetrics || []),
                                  action.payload,
                              ],
                    },
                },
            };
        }

        case ActionType.REMOVE_ADDITIONAL_METRIC: {
            return {
                ...state,
                unsavedChartVersion: {
                    ...state.unsavedChartVersion,
                    metricQuery: {
                        ...state.unsavedChartVersion.metricQuery,
                        additionalMetrics: (
                            state.unsavedChartVersion.metricQuery
                                .additionalMetrics || []
                        ).filter(
                            (metric) => getFieldId(metric) !== action.payload,
                        ),
                        metrics:
                            state.unsavedChartVersion.metricQuery.metrics.filter(
                                (metric) => metric !== action.payload,
                            ),
                        sorts: state.unsavedChartVersion.metricQuery.sorts.filter(
                            (sort) => sort.fieldId !== action.payload,
                        ),
                    },
                    tableConfig: {
                        ...state.unsavedChartVersion.tableConfig,
                        columnOrder:
                            state.unsavedChartVersion.tableConfig.columnOrder.filter(
                                (fieldId) => fieldId !== action.payload,
                            ),
                    },
                },
            };
        }
        case ActionType.SET_COLUMN_ORDER: {
            return {
                ...state,
                unsavedChartVersion: {
                    ...state.unsavedChartVersion,
                    tableConfig: {
                        ...state.unsavedChartVersion.tableConfig,
                        columnOrder: calcColumnOrder(action.payload, [
                            ...state.unsavedChartVersion.metricQuery.dimensions,
                            ...state.unsavedChartVersion.metricQuery.metrics,
                            ...state.unsavedChartVersion.metricQuery.tableCalculations.map(
                                ({ name }) => name,
                            ),
                        ]),
                    },
                },
            };
        }
        case ActionType.ADD_TABLE_CALCULATION: {
            const newTableCalculations = [
                ...state.unsavedChartVersion.metricQuery.tableCalculations,
                action.payload,
            ];
            return {
                ...state,
                unsavedChartVersion: {
                    ...state.unsavedChartVersion,
                    metricQuery: {
                        ...state.unsavedChartVersion.metricQuery,
                        tableCalculations: newTableCalculations,
                    },
                    tableConfig: {
                        ...state.unsavedChartVersion.tableConfig,
                        columnOrder: calcColumnOrder(
                            state.unsavedChartVersion.tableConfig.columnOrder,
                            [
                                ...state.unsavedChartVersion.metricQuery
                                    .dimensions,
                                ...state.unsavedChartVersion.metricQuery
                                    .metrics,
                                ...newTableCalculations.map(({ name }) => name),
                            ],
                        ),
                    },
                },
            };
        }
        case ActionType.UPDATE_TABLE_CALCULATION: {
            return {
                ...state,
                unsavedChartVersion: {
                    ...state.unsavedChartVersion,
                    metricQuery: {
                        ...state.unsavedChartVersion.metricQuery,
                        tableCalculations:
                            state.unsavedChartVersion.metricQuery.tableCalculations.map(
                                (tableCalculation) =>
                                    tableCalculation.name ===
                                    action.payload.oldName
                                        ? action.payload.tableCalculation
                                        : tableCalculation,
                            ),
                        sorts: state.unsavedChartVersion.metricQuery.sorts.map(
                            (field) =>
                                field.fieldId === action.payload.oldName
                                    ? {
                                          ...field,
                                          fieldId:
                                              action.payload.tableCalculation
                                                  .name,
                                      }
                                    : field,
                        ),
                    },
                    tableConfig: {
                        ...state.unsavedChartVersion.tableConfig,
                        columnOrder:
                            state.unsavedChartVersion.tableConfig.columnOrder.map(
                                (column) =>
                                    column === action.payload.oldName
                                        ? action.payload.tableCalculation.name
                                        : column,
                            ),
                    },
                },
            };
        }
        case ActionType.DELETE_TABLE_CALCULATION: {
            const newTableCalculations =
                state.unsavedChartVersion.metricQuery.tableCalculations.filter(
                    (tableCalculation) =>
                        tableCalculation.name !== action.payload,
                );
            return {
                ...state,
                unsavedChartVersion: {
                    ...state.unsavedChartVersion,
                    metricQuery: {
                        ...state.unsavedChartVersion.metricQuery,
                        tableCalculations: newTableCalculations,
                        sorts: state.unsavedChartVersion.metricQuery.sorts.filter(
                            (sort) => sort.fieldId !== action.payload,
                        ),
                    },
                    tableConfig: {
                        ...state.unsavedChartVersion.tableConfig,
                        columnOrder: calcColumnOrder(
                            state.unsavedChartVersion.tableConfig.columnOrder,
                            [
                                ...state.unsavedChartVersion.metricQuery
                                    .dimensions,
                                ...state.unsavedChartVersion.metricQuery
                                    .metrics,
                                ...newTableCalculations.map(({ name }) => name),
                            ],
                        ),
                    },
                },
            };
        }
        case ActionType.SET_PIVOT_FIELDS: {
            return {
                ...state,
                unsavedChartVersion: {
                    ...state.unsavedChartVersion,
                    pivotConfig:
                        action.payload.length > 0
                            ? {
                                  columns: action.payload,
                              }
                            : undefined,
                },
            };
        }
        case ActionType.SET_CHART_TYPE: {
            return {
                ...state,
                unsavedChartVersion: {
                    ...state.unsavedChartVersion,
                    chartConfig: getValidChartConfig(
                        action.payload,
                        state.unsavedChartVersion.chartConfig.config,
                    ),
                },
            };
        }
        case ActionType.SET_CHART_CONFIG: {
            return {
                ...state,
                unsavedChartVersion: {
                    ...state.unsavedChartVersion,
                    chartConfig: getValidChartConfig(
                        state.unsavedChartVersion.chartConfig.type,
                        action.payload,
                    ),
                },
            };
        }
        default: {
            return assertUnreachable(
                action,
                'Unexpected action in explore reducer',
            );
        }
    }
}

export const ExplorerProvider: FC<{
    isEditMode?: boolean;
    initialState?: ExplorerReduceState;
    savedChart?: SavedChart;
    queryResults: ReturnType<typeof useQueryResults>;
}> = ({
    isEditMode = false,
    initialState,
    savedChart,
    children,
    queryResults,
}) => {
    const [reducerState, dispatch] = useReducer(
        reducer,
        initialState || defaultState,
    );
    const { unsavedChartVersion } = reducerState;

    const [activeFields, isValidQuery] = useMemo<
        [Set<FieldId>, boolean]
    >(() => {
        const fields = new Set([
            ...unsavedChartVersion.metricQuery.dimensions,
            ...unsavedChartVersion.metricQuery.metrics,
            ...unsavedChartVersion.metricQuery.tableCalculations.map(
                ({ name }) => name,
            ),
        ]);
        return [fields, fields.size > 0];
    }, [unsavedChartVersion]);

    const reset = useCallback(() => {
        dispatch({
            type: ActionType.RESET,
            payload: initialState || defaultState,
        });
    }, [initialState]);

    const setTableName = useCallback((tableName: string) => {
        dispatch({
            type: ActionType.SET_TABLE_NAME,
            payload: tableName,
        });
    }, []);

    const toggleExpandedSection = useCallback((payload: ExplorerSection) => {
        dispatch({
            type: ActionType.TOGGLE_EXPANDED_SECTION,
            payload,
        });
    }, []);

    const toggleActiveField = useCallback(
        (fieldId: FieldId, isDimension: boolean) => {
            dispatch({
                type: isDimension
                    ? ActionType.TOGGLE_DIMENSION
                    : ActionType.TOGGLE_METRIC,
                payload: fieldId,
            });
        },
        [],
    );

    const removeActiveField = useCallback((fieldId: FieldId) => {
        dispatch({
            type: ActionType.REMOVE_FIELD,
            payload: fieldId,
        });
    }, []);

    const toggleSortField = useCallback((fieldId: FieldId) => {
        dispatch({
            type: ActionType.TOGGLE_SORT_FIELD,
            payload: fieldId,
            options: {
                shouldFetchResults: true,
            },
        });
    }, []);

    const setSortFields = useCallback((sortFields: SortField[]) => {
        dispatch({
            type: ActionType.SET_SORT_FIELDS,
            payload: sortFields,
            options: {
                shouldFetchResults: true,
            },
        });
    }, []);

    const removeSortField = useCallback((fieldId: FieldId) => {
        dispatch({
            type: ActionType.REMOVE_SORT_FIELD,
            payload: fieldId,
            options: {
                shouldFetchResults: true,
            },
        });
    }, []);

    const moveSortFields = useCallback(
        (sourceIndex: number, destinationIndex: number) => {
            dispatch({
                type: ActionType.MOVE_SORT_FIELDS,
                payload: { sourceIndex, destinationIndex },
                options: {
                    shouldFetchResults: true,
                },
            });
        },
        [],
    );

    const addSortField = useCallback(
        (
            fieldId: FieldId,
            options: { descending: boolean } = { descending: false },
        ) => {
            dispatch({
                type: ActionType.ADD_SORT_FIELD,
                payload: { fieldId, ...options },
                options: {
                    shouldFetchResults: true,
                },
            });
        },
        [],
    );

    const setRowLimit = useCallback((limit: number) => {
        dispatch({
            type: ActionType.SET_ROW_LIMIT,
            payload: limit,
            options: {
                shouldFetchResults: true,
            },
        });
    }, []);

    const setFilters = useCallback(
        (filters: MetricQuery['filters'], shouldFetchResults: boolean) => {
            dispatch({
                type: ActionType.SET_FILTERS,
                payload: filters,
                options: {
                    shouldFetchResults,
                },
            });
        },
        [],
    );

    const setPivotFields = useCallback((fields: FieldId[] = []) => {
        dispatch({
            type: ActionType.SET_PIVOT_FIELDS,
            payload: fields,
        });
    }, []);

    const setChartType = useCallback((chartType: ChartType) => {
        dispatch({
            type: ActionType.SET_CHART_TYPE,
            payload: chartType,
        });
    }, []);

    const setChartConfig = useCallback(
        (chartConfig: ChartConfig['config'] | undefined) => {
            dispatch({
                type: ActionType.SET_CHART_CONFIG,
                payload: chartConfig,
            });
        },
        [],
    );

    const addAdditionalMetric = useCallback(
        (additionalMetric: AdditionalMetric) => {
            dispatch({
                type: ActionType.ADD_ADDITIONAL_METRIC,
                payload: additionalMetric,
            });
            dispatch({
                type: ActionType.TOGGLE_METRIC,
                payload: getFieldId(additionalMetric),
            });
        },
        [],
    );

    const removeAdditionalMetric = useCallback((key: FieldId) => {
        dispatch({
            type: ActionType.REMOVE_ADDITIONAL_METRIC,
            payload: key,
        });
    }, []);

    const setColumnOrder = useCallback((order: string[]) => {
        dispatch({
            type: ActionType.SET_COLUMN_ORDER,
            payload: order,
        });
    }, []);

    const addTableCalculation = useCallback(
        (tableCalculation: TableCalculation) => {
            if (
                unsavedChartVersion.metricQuery.tableCalculations.findIndex(
                    ({ name }) => name === tableCalculation.name,
                ) > -1
            ) {
                throw new Error(
                    `Table calculation ID "${tableCalculation.name}" already exists.`,
                );
            }
            dispatch({
                type: ActionType.ADD_TABLE_CALCULATION,
                payload: tableCalculation,
                options: {
                    shouldFetchResults: true,
                },
            });
        },
        [unsavedChartVersion],
    );
    const updateTableCalculation = useCallback(
        (oldName: string, tableCalculation: TableCalculation) => {
            if (
                oldName !== tableCalculation.name &&
                unsavedChartVersion.metricQuery.tableCalculations.findIndex(
                    ({ name }) => name === tableCalculation.name,
                ) > -1
            ) {
                throw new Error(
                    `Id: "${tableCalculation.name}" already exists.`,
                );
            }
            dispatch({
                type: ActionType.UPDATE_TABLE_CALCULATION,
                payload: { oldName, tableCalculation },
                options: {
                    shouldFetchResults: true,
                },
            });
        },
        [unsavedChartVersion],
    );
    const deleteTableCalculation = useCallback((name: string) => {
        dispatch({
            type: ActionType.DELETE_TABLE_CALCULATION,
            payload: name,
        });
    }, []);

    const hasUnsavedChanges = useMemo<boolean>(() => {
        if (savedChart) {
            return !deepEqual(
                removeEmptyProperties({
                    tableName: savedChart.tableName,
                    chartConfig: savedChart.chartConfig,
                    metricQuery: savedChart.metricQuery,
                    tableConfig: savedChart.tableConfig,
                    pivotConfig: savedChart.pivotConfig,
                }),
                removeEmptyProperties(unsavedChartVersion),
            );
        }
        return isValidQuery;
    }, [unsavedChartVersion, isValidQuery, savedChart]);

    const state = useMemo(
        () => ({
            ...reducerState,
            isEditMode,
            activeFields,
            isValidQuery,
            hasUnsavedChanges,
            savedChart,
        }),
        [
            isEditMode,
            reducerState,
            activeFields,
            isValidQuery,
            hasUnsavedChanges,
            savedChart,
        ],
    );

    // Fetch query results after state update
    const { mutateAsync: mutateAsyncQuery, reset: resetQueryResults } =
        queryResults;

    const mutateAsync = useCallback(async () => {
        try {
            const result = await mutateAsyncQuery(
                unsavedChartVersion.tableName,
                unsavedChartVersion.metricQuery,
            );

            dispatch({
                type: ActionType.SET_PREVIOUSLY_FETCHED_STATE,
                payload: cloneDeep(unsavedChartVersion.metricQuery),
            });

            return result;
        } catch (e) {
            console.error(e);
        }
    }, [
        mutateAsyncQuery,
        unsavedChartVersion.tableName,
        unsavedChartVersion.metricQuery,
    ]);

    const hasUnfetchedChanges = useMemo(() => {
        return !isEqual(
            state.unsavedChartVersion.metricQuery,
            state.previouslyFetchedState,
        );
    }, [state.unsavedChartVersion.metricQuery, state.previouslyFetchedState]);

    useEffect(() => {
        if (!state.shouldFetchResults) return;

        mutateAsync().then(() => {
            dispatch({
                type: ActionType.SET_FETCH_RESULTS_FALSE,
            });
        });
    }, [mutateAsync, state.shouldFetchResults]);

    const clear = useCallback(async () => {
        dispatch({
            type: ActionType.RESET,
            payload: defaultState,
        });
        resetQueryResults();
    }, [resetQueryResults]);

    const defaultSort = useDefaultSortField(unsavedChartVersion);

    const fetchResults = useCallback(() => {
        if (unsavedChartVersion.metricQuery.sorts.length <= 0 && defaultSort) {
            setSortFields([defaultSort]);
        } else {
            mutateAsync();
        }
    }, [defaultSort, mutateAsync, unsavedChartVersion, setSortFields]);

    const actions = useMemo(
        () => ({
            clear,
            reset,
            setTableName,
            removeActiveField,
            toggleActiveField,
            toggleSortField,
            setSortFields,
            addSortField,
            removeSortField,
            moveSortFields,
            setFilters,
            setRowLimit,
            setColumnOrder,
            addAdditionalMetric,
            removeAdditionalMetric,
            addTableCalculation,
            deleteTableCalculation,
            updateTableCalculation,
            setPivotFields,
            setChartType,
            setChartConfig,
            fetchResults,
            toggleExpandedSection,
        }),
        [
            clear,
            reset,
            setTableName,
            removeActiveField,
            toggleActiveField,
            toggleSortField,
            setSortFields,
            addSortField,
            removeSortField,
            moveSortFields,
            setFilters,
            setRowLimit,
            setColumnOrder,
            addAdditionalMetric,
            removeAdditionalMetric,
            addTableCalculation,
            deleteTableCalculation,
            updateTableCalculation,
            setPivotFields,
            setChartType,
            setChartConfig,
            fetchResults,
            toggleExpandedSection,
        ],
    );

    const value: ExplorerContext = useMemo(
        () => ({
            state,
            queryResults,
            hasUnfetchedChanges,
            actions,
        }),
        [actions, queryResults, state, hasUnfetchedChanges],
    );
    return <Context.Provider value={value}>{children}</Context.Provider>;
};

/**
 * @deprecated The method should not be used. Should be replaced with useExplorerContext hook
 */
export function useExplorer(): ExplorerContext {
    const context = useContext(Context);
    if (context === undefined) {
        throw new Error('useExplorer must be used within a ExplorerProvider');
    }
    return context;
}

export function useExplorerContext<Selected>(
    selector: (value: ExplorerContext) => Selected,
) {
    return useContextSelector(Context, (context) => {
        if (context === undefined) {
            throw new Error(
                'useExplorer must be used within a ExplorerProvider',
            );
        }
        return selector(context);
    });
}
