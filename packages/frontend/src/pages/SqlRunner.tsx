import {
    HotkeyConfig,
    Menu,
    Tab,
    TreeNodeInfo,
    useHotkeys,
} from '@blueprintjs/core';
import { MenuItem2 } from '@blueprintjs/popover2';
import { subject } from '@casl/ability';
import {
    ChartType,
    DbtCloudMetric,
    getCustomLabelsFromTableConfig,
    NotFoundError,
    TableBase,
} from '@lightdash/common';
import { Icon123 } from '@tabler/icons-react';
import { useCallback, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams } from 'react-router-dom';
import { useMount } from 'react-use';
import { ChartDownloadMenu } from '../components/ChartDownload';
import CollapsableCard from '../components/common/CollapsableCard';
import {
    PageContentContainer,
    PageWithSidebar,
} from '../components/common/Page/Page.styles';
import Sidebar, { SidebarDivider } from '../components/common/Page/Sidebar';
import ShareShortLinkButton from '../components/common/ShareShortLinkButton';
import SideBarLoadingState from '../components/common/SideBarLoadingState';
import { Tree } from '../components/common/Tree';
import DownloadCsvButton from '../components/DownloadCsvButton';
import DownloadSqlCsvButton from '../components/DownloadSqlCsvButton';
import { StyledBreadcrumb } from '../components/Explorer/ExploreSideBar/ExploreSideBar.styles';
import VisualizationConfigPanel from '../components/Explorer/VisualizationCard/VisualizationConfigPanel';
import VisualizationCardOptions from '../components/Explorer/VisualizationCardOptions';
import ForbiddenPanel from '../components/ForbiddenPanel';
import LightdashVisualization from '../components/LightdashVisualization';
import VisualizationProvider from '../components/LightdashVisualization/VisualizationProvider';
import RefreshDbtButton from '../components/RefreshDbtButton';
import RunSqlQueryButton from '../components/SqlRunner/RunSqlQueryButton';
import SqlRunnerInput from '../components/SqlRunner/SqlRunnerInput';
import SqlRunnerResultsTable from '../components/SqlRunner/SqlRunnerResultsTable';
import { useProjectDbtCloudMetrics } from '../hooks/dbtCloud/useProjectDbtCloudMetrics';
import { downloadCsvFromSqlRunner } from '../hooks/useDownloadCsv';
import { useProjectCatalog } from '../hooks/useProjectCatalog';
import { useProjectCatalogTree } from '../hooks/useProjectCatalogTree';
import { useSqlQueryMutation } from '../hooks/useSqlQuery';
import useSqlQueryVisualization from '../hooks/useSqlQueryVisualization';
import {
    useSqlRunnerRoute,
    useSqlRunnerUrlState,
} from '../hooks/useSqlRunnerRoute';
import { useApp } from '../providers/AppProvider';
import { TrackSection } from '../providers/TrackingProvider';
import { SectionName } from '../types/Events';
import {
    ButtonsWrapper,
    MissingTablesInfo,
    SideBarWrapper,
    SqlCallout,
    StyledTabs,
} from './SqlRunner.styles';

const generateBasicSqlQuery = (table: string) =>
    `SELECT *
   FROM ${table} LIMIT 25`;

const generateDefaultDbtMetricQuery = (metric: DbtCloudMetric) => {
    const args: string[] = [`metric('${metric.name}')`];
    if (metric.dimensions.length > 0) {
        args.push(
            `dimensions=[${metric.dimensions.map((d) => `'${d}'`).join(', ')}]`,
        );
    }
    if (metric.timeGrains.length > 0) {
        args.push(`grain='${metric.timeGrains[0]}'`);
    }
    return `SELECT *
          FROM {{ metrics.calculate(
                  ${args.join(',\n    ')}
              )}} LIMIT 500`;
};

enum SqlRunnerCards {
    CHART = 'CHART',
    SQL = 'SQL',
    RESULTS = 'RESULTS',
}

const SqlRunnerPage = () => {
    const [activeTabId, setActiveTabId] = useState<string | number>(
        'warehouse-schema',
    );
    const { user } = useApp();
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const initialState = useSqlRunnerUrlState();
    const metrics = useProjectDbtCloudMetrics();
    const sqlQueryMutation = useSqlQueryMutation();
    const { isLoading: isCatalogLoading, data: catalogData } =
        useProjectCatalog();

    const [sql, setSql] = useState<string>(initialState?.sqlRunner?.sql || '');
    const [lastSqlRan, setLastSqlRan] = useState<string>();
    const [expandedCards, setExpandedCards] = useState<
        Map<SqlRunnerCards, boolean>
    >(
        new Map([
            [SqlRunnerCards.CHART, false],
            [SqlRunnerCards.SQL, true],
            [SqlRunnerCards.RESULTS, true],
        ]),
    );

    const handleCardExpand = (card: SqlRunnerCards, value: boolean) => {
        setExpandedCards((prev) => new Map(prev).set(card, value));
    };

    const { isLoading, mutate } = sqlQueryMutation;
    const {
        initialChartConfig,
        initialPivotDimensions,
        explore,
        chartType,
        resultsData,
        columnOrder,
        createSavedChart,
        fieldsMap,
        setChartType,
        setChartConfig,
        setPivotFields,
    } = useSqlQueryVisualization({
        initialState: initialState?.createSavedChart,
        sqlQueryMutation,
    });

    const sqlRunnerState = useMemo(
        () => ({
            createSavedChart,
            sqlRunner: lastSqlRan ? { sql: lastSqlRan } : undefined,
        }),
        [createSavedChart, lastSqlRan],
    );

    useSqlRunnerRoute(sqlRunnerState);

    const onSubmit = useCallback(() => {
        if (sql) {
            mutate(sql);
            setLastSqlRan(sql);
        }
    }, [mutate, sql]);

    useMount(() => {
        if (sql) {
            mutate(sql);
            setLastSqlRan(sql);
        }
    });

    const hotkeys: HotkeyConfig[] = useMemo(
        () => [
            {
                combo: 'mod+enter',
                group: 'SQL runner',
                label: 'Run SQL query',
                allowInInput: true,
                onKeyDown: onSubmit,
                global: true,
                preventDefault: true,
                stopPropagation: true,
            },
        ],
        [onSubmit],
    );

    useHotkeys(hotkeys);

    const catalogTree = useProjectCatalogTree(catalogData);

    const handleNodeClick = useCallback(
        (node: TreeNodeInfo) => {
            if (node.nodeData) {
                setSql(
                    generateBasicSqlQuery(
                        (node.nodeData as TableBase).sqlTable,
                    ),
                );
            }
        },
        [setSql],
    );

    const cannotManageSqlRunner = user.data?.ability?.cannot(
        'manage',
        subject('SqlRunner', {
            organizationUuid: user.data?.organizationUuid,
            projectUuid,
        }),
    );
    const cannotViewProject = user.data?.ability?.cannot('view', 'Project');
    if (cannotManageSqlRunner || cannotViewProject) {
        return <ForbiddenPanel />;
    }

    const getCsvLink = async () => {
        if (sql) {
            const customLabels = getCustomLabelsFromTableConfig(
                createSavedChart?.chartConfig.config,
            );
            const customLabelsWithoutTablePrefix = customLabels
                ? Object.fromEntries<string>(
                      Object.entries(customLabels).map(([key, value]) => [
                          key.replace(/^sql_runner_/, ''),
                          value,
                      ]),
                  )
                : undefined;
            const csvResponse = await downloadCsvFromSqlRunner({
                projectUuid,
                sql,
                customLabels: customLabelsWithoutTablePrefix,
            });
            return csvResponse.url;
        }
        throw new NotFoundError('no SQL query defined');
    };

    return (
        <PageWithSidebar>
            <Helmet>
                <title>SQL Runner - Lighthouse</title>
            </Helmet>
            <Sidebar>
                <StyledBreadcrumb items={[{ text: 'SQL Runner' }]} />

                <SidebarDivider />

                {!!metrics.data?.metrics.length && (
                    <StyledTabs
                        id="sql-runner"
                        selectedTabId={activeTabId}
                        onChange={setActiveTabId}
                    >
                        <Tab id="warehouse-schema" title="Warehouse Schema" />
                        <Tab id="metrics" title="dbt metrics" />
                    </StyledTabs>
                )}

                <SideBarWrapper>
                    {activeTabId === 'warehouse-schema' &&
                        (isCatalogLoading ? (
                            <SideBarLoadingState />
                        ) : (
                            <>
                                <Tree
                                    setExpandedCards={setExpandedCards}
                                    contents={catalogTree}
                                    handleSelect={false}
                                    onNodeClick={handleNodeClick}
                                />
                                <MissingTablesInfo content="Currently we only display tables that are declared in the dbt project.">
                                    <SqlCallout intent="none" icon="info-sign">
                                        Tables missing?
                                    </SqlCallout>
                                </MissingTablesInfo>
                            </>
                        ))}
                    {activeTabId === 'metrics' &&
                        !!metrics.data?.metrics.length && (
                            <Menu>
                                {metrics.data.metrics.map((metric) => (
                                    <MenuItem2
                                        key={metric.uniqueId}
                                        icon={<Icon123 />}
                                        text={metric.label}
                                        onClick={() =>
                                            setSql(
                                                generateDefaultDbtMetricQuery(
                                                    metric,
                                                ),
                                            )
                                        }
                                    />
                                ))}
                            </Menu>
                        )}
                </SideBarWrapper>
            </Sidebar>

            <PageContentContainer>
                <TrackSection name={SectionName.EXPLORER_TOP_BUTTONS}>
                    <ButtonsWrapper>
                        <RefreshDbtButton />
                        <div>
                            <RunSqlQueryButton
                                onSubmit={onSubmit}
                                isLoading={isLoading}
                            />
                            <ShareShortLinkButton
                                disabled={lastSqlRan === undefined}
                            />
                        </div>
                    </ButtonsWrapper>
                </TrackSection>

                <VisualizationProvider
                    initialChartConfig={initialChartConfig}
                    chartType={chartType}
                    initialPivotDimensions={initialPivotDimensions}
                    resultsData={resultsData}
                    isLoading={isLoading}
                    onChartConfigChange={setChartConfig}
                    onChartTypeChange={setChartType}
                    onPivotDimensionsChange={setPivotFields}
                    columnOrder={columnOrder}
                    explore={explore}
                >
                    <CollapsableCard
                        title="Charts"
                        rightHeaderElement={
                            expandedCards.get(SqlRunnerCards.CHART) && (
                                <>
                                    <VisualizationCardOptions />
                                    <VisualizationConfigPanel
                                        chartType={chartType}
                                    />
                                    {chartType === ChartType.TABLE && (
                                        <DownloadSqlCsvButton
                                            getCsvLink={getCsvLink}
                                            disabled={!sql}
                                        />
                                    )}
                                    <ChartDownloadMenu
                                        projectUuid={projectUuid}
                                    />
                                </>
                            )
                        }
                        isOpen={expandedCards.get(SqlRunnerCards.CHART)}
                        shouldExpand
                        onToggle={(value) =>
                            handleCardExpand(SqlRunnerCards.CHART, value)
                        }
                    >
                        <LightdashVisualization className="sentry-block fs-block cohere-block" />
                    </CollapsableCard>
                </VisualizationProvider>

                <CollapsableCard
                    title="SQL"
                    isOpen={expandedCards.get(SqlRunnerCards.SQL)}
                    onToggle={(value) =>
                        handleCardExpand(SqlRunnerCards.SQL, value)
                    }
                >
                    <SqlRunnerInput
                        sql={sql}
                        onChange={setSql}
                        projectCatalog={catalogData}
                        isDisabled={isLoading}
                    />
                </CollapsableCard>

                <CollapsableCard
                    title="Results"
                    isOpen={expandedCards.get(SqlRunnerCards.RESULTS)}
                    onToggle={(value) =>
                        handleCardExpand(SqlRunnerCards.RESULTS, value)
                    }
                >
                    <SqlRunnerResultsTable
                        onSubmit={onSubmit}
                        resultsData={resultsData}
                        fieldsMap={fieldsMap}
                        sqlQueryMutation={sqlQueryMutation}
                    />
                </CollapsableCard>
            </PageContentContainer>
        </PageWithSidebar>
    );
};
export default SqlRunnerPage;
