import { Card } from '@blueprintjs/core';
import { subject } from '@casl/ability';
import { memo } from 'react';
import { Helmet } from 'react-helmet';
import { useParams } from 'react-router-dom';
import {
    CardContent,
    PageContentContainer,
    PageWrapper,
    Resizer,
    StickySidebar,
} from '../components/common/Page/Page.styles';
import Explorer from '../components/Explorer';
import ExploreSideBar from '../components/Explorer/ExploreSideBar/index';
import ForbiddenPanel from '../components/ForbiddenPanel';
import { useExplore } from '../hooks/useExplore';
import {
    useExplorerRoute,
    useExplorerUrlState,
} from '../hooks/useExplorerRoute';
import { useQueryResults } from '../hooks/useQueryResults';
import useSidebarResize from '../hooks/useSidebarResize';
import { useApp } from '../providers/AppProvider';
import {
    ExplorerProvider,
    useExplorerContext,
} from '../providers/ExplorerProvider';

const ExplorerWithUrlParams = memo(() => {
    useExplorerRoute();
    const tableId = useExplorerContext(
        (context) => context.state.unsavedChartVersion.tableName,
    );
    const { data } = useExplore(tableId);
    return (
        <>
            <Helmet>
                <title>{data ? data?.label : 'Tables'} - Lighthouse</title>
            </Helmet>
            <Explorer />
        </>
    );
});

const ExplorerPage = memo(() => {
    const { projectUuid } = useParams<{ projectUuid: string }>();

    const explorerUrlState = useExplorerUrlState();
    const { sidebarRef, sidebarWidth, isResizing, startResizing } =
        useSidebarResize({
            defaultWidth: 400,
            minWidth: 300,
            maxWidth: 600,
        });

    const { user } = useApp();

    const queryResults = useQueryResults();

    const cannotViewProject = user.data?.ability?.cannot(
        'view',
        subject('Project', {
            organizationUuid: user.data?.organizationUuid,
            projectUuid,
        }),
    );
    const cannotManageExplore = user.data?.ability?.cannot(
        'manage',
        subject('Explore', {
            organizationUuid: user.data?.organizationUuid,
            projectUuid,
        }),
    );
    if (cannotViewProject || cannotManageExplore) {
        return <ForbiddenPanel />;
    }

    return (
        <ExplorerProvider
            isEditMode={true}
            initialState={explorerUrlState}
            queryResults={queryResults}
        >
            <PageWrapper>
                <StickySidebar
                    ref={sidebarRef}
                    style={{
                        width: sidebarWidth + 5,
                    }}
                >
                    <Card
                        elevation={1}
                        style={{
                            width: sidebarWidth,
                        }}
                    >
                        <CardContent>
                            <ExploreSideBar />
                        </CardContent>
                    </Card>

                    <Resizer
                        onMouseDown={startResizing}
                        $isResizing={isResizing}
                    />
                </StickySidebar>

                <PageContentContainer hasDraggableSidebar>
                    <ExplorerWithUrlParams />
                </PageContentContainer>
            </PageWrapper>
        </ExplorerProvider>
    );
});

export default ExplorerPage;
