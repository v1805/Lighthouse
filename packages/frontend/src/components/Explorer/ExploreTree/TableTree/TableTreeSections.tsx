import { Colors } from '@blueprintjs/core';
import { AdditionalMetric, CompiledTable, getItemId } from '@lightdash/common';
import { FC, useMemo } from 'react';
import DocumentationHelpButton from '../../../DocumentationHelpButton';
import {
    CustomMetricsSectionRow,
    DimensionsSectionRow,
    EmptyState,
    MetricsSectionRow,
    SpanFlex,
    TooltipContent,
} from './TableTree.styles';
import { getSearchResults, TreeProvider } from './Tree/TreeProvider';
import TreeRoot from './Tree/TreeRoot';

type Props = {
    searchQuery?: string;
    table: CompiledTable;
    additionalMetrics: AdditionalMetric[];
    selectedItems: Set<string>;
    onSelectedNodeChange: (itemId: string, isDimension: boolean) => void;
    depth: number;
};
const TableTreeSections: FC<Props> = ({
    searchQuery,
    table,
    additionalMetrics,
    selectedItems,
    onSelectedNodeChange,
    depth,
}) => {
    const sectionDepth = depth;
    const treeRootDepth = depth + 1;
    const hasNoMetrics = Object.keys(table.metrics).length <= 0;

    const isSearching = !!searchQuery && searchQuery !== '';

    const dimensions = useMemo(() => {
        return Object.values(table.dimensions).reduce(
            (acc, item) => ({ ...acc, [getItemId(item)]: item }),
            {},
        );
    }, [table.dimensions]);

    const metrics = useMemo(() => {
        return Object.values(table.metrics).reduce(
            (acc, item) => ({ ...acc, [getItemId(item)]: item }),
            {},
        );
    }, [table.metrics]);

    const customMetrics = useMemo(() => {
        return additionalMetrics.reduce<Record<string, AdditionalMetric>>(
            (acc, item) => ({ ...acc, [getItemId(item)]: item }),
            {},
        );
    }, [additionalMetrics]);

    return (
        <>
            {isSearching &&
            getSearchResults(dimensions, searchQuery).size === 0 ? (
                <></>
            ) : (
                <DimensionsSectionRow depth={sectionDepth}>
                    Dimensions
                </DimensionsSectionRow>
            )}

            {Object.keys(table.dimensions).length <= 0 ? (
                <EmptyState>
                    No dimensions defined in your dbt project
                </EmptyState>
            ) : (
                <TreeProvider
                    orderFieldsBy={table.orderFieldsBy}
                    searchQuery={searchQuery}
                    itemsMap={dimensions}
                    selectedItems={selectedItems}
                    onItemClick={(key) => onSelectedNodeChange(key, true)}
                >
                    <TreeRoot depth={treeRootDepth} />
                </TreeProvider>
            )}

            {isSearching &&
            getSearchResults(metrics, searchQuery).size === 0 ? (
                <></>
            ) : (
                <MetricsSectionRow depth={sectionDepth}>
                    Metrics
                    <SpanFlex />
                    {hasNoMetrics && (
                        <DocumentationHelpButton
                            url={
                                'https://docs.lightdash.com/guides/how-to-create-metrics'
                            }
                            tooltipProps={{
                                content: (
                                    <TooltipContent>
                                        No metrics defined in your dbt project.
                                        <br />
                                        Click to <b>view docs</b> and learn how
                                        to add a metric to your project.
                                    </TooltipContent>
                                ),
                            }}
                            iconProps={{
                                style: {
                                    color: Colors.GRAY3,
                                },
                            }}
                        />
                    )}
                </MetricsSectionRow>
            )}

            {!hasNoMetrics && (
                <TreeProvider
                    orderFieldsBy={table.orderFieldsBy}
                    searchQuery={searchQuery}
                    itemsMap={metrics}
                    selectedItems={selectedItems}
                    onItemClick={(key) => onSelectedNodeChange(key, false)}
                >
                    <TreeRoot depth={treeRootDepth} />
                </TreeProvider>
            )}

            {isSearching &&
            getSearchResults(customMetrics, searchQuery).size === 0 ? (
                <></>
            ) : (
                <CustomMetricsSectionRow depth={sectionDepth}>
                    Custom metrics
                    <SpanFlex />
                    <DocumentationHelpButton
                        url={
                            'https://docs.lightdash.com/guides/how-to-create-metrics#-adding-custom-metrics-in-the-explore-view'
                        }
                        tooltipProps={{
                            content: (
                                <TooltipContent>
                                    Add custom metrics by hovering over the
                                    dimension of your choice & selecting the
                                    three-dot Action Menu.{' '}
                                    <b>Click to view docs.</b>
                                </TooltipContent>
                            ),
                        }}
                        iconProps={{
                            style: {
                                color: Colors.GRAY3,
                            },
                        }}
                    />
                </CustomMetricsSectionRow>
            )}

            {hasNoMetrics || additionalMetrics.length > 0 ? (
                <TreeProvider
                    orderFieldsBy={table.orderFieldsBy}
                    searchQuery={searchQuery}
                    itemsMap={customMetrics}
                    selectedItems={selectedItems}
                    onItemClick={(key) => onSelectedNodeChange(key, false)}
                >
                    <TreeRoot depth={treeRootDepth} />
                </TreeProvider>
            ) : null}
        </>
    );
};

export default TableTreeSections;
