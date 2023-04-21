import { MenuDivider } from '@blueprintjs/core';
import { MenuItem2, Tooltip2 } from '@blueprintjs/popover2';

import React, { FC, memo } from 'react';
import { useExplore } from '../../../hooks/useExplore';
import { useExplorerContext } from '../../../providers/ExplorerProvider';
import { SidebarDivider } from '../../common/Page/Sidebar';
import { StyledBreadcrumb } from '../ExploreSideBar/ExploreSideBar.styles';
import ExploreTree from '../ExploreTree';
import { LoadingStateWrapper } from './ExplorePanel.styles';

const SideBarLoadingState = () => (
    <LoadingStateWrapper large>
        {[0, 1, 2, 3, 4].map((idx) => (
            <React.Fragment key={idx}>
                <MenuItem2 className="bp4-skeleton" />
                <MenuDivider />
            </React.Fragment>
        ))}
    </LoadingStateWrapper>
);

interface ExplorePanelProps {
    onBack?: () => void;
}

const ExplorePanel: FC<ExplorePanelProps> = memo(({ onBack }) => {
    const activeTableName = useExplorerContext(
        (context) => context.state.unsavedChartVersion.tableName,
    );
    const additionalMetrics = useExplorerContext(
        (context) =>
            context.state.unsavedChartVersion.metricQuery.additionalMetrics,
    );
    const activeFields = useExplorerContext(
        (context) => context.state.activeFields,
    );
    const toggleActiveField = useExplorerContext(
        (context) => context.actions.toggleActiveField,
    );

    const { data, status } = useExplore(activeTableName);

    if (status === 'loading') {
        return <SideBarLoadingState />;
    }

    if (data) {
        const tableBreadcrumbItem = {
            children: (
                <Tooltip2 content={data.tables[data.baseTable].description}>
                    {data.label}
                </Tooltip2>
            ),
        };

        return (
            <>
                <StyledBreadcrumb
                    items={
                        onBack
                            ? [
                                  {
                                      text: 'Tables',
                                      onClick: onBack,
                                  },
                                  tableBreadcrumbItem,
                              ]
                            : [tableBreadcrumbItem]
                    }
                />

                <SidebarDivider />

                <ExploreTree
                    explore={data}
                    additionalMetrics={additionalMetrics || []}
                    selectedNodes={activeFields}
                    onSelectedFieldChange={toggleActiveField}
                />
            </>
        );
    }

    if (status === 'error') {
        if (onBack) onBack();
        return null;
    }

    return <span>Cannot load explore</span>;
});

export default ExplorePanel;
