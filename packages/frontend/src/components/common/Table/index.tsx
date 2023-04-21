import { ComponentProps, FC } from 'react';
import ScrollableTable from './ScrollableTable';
import * as States from './States';
import { TableContainer } from './Table.styles';
import TablePagination from './TablePagination';
import { TableProvider } from './TableProvider';

type Props = ComponentProps<typeof TableProvider> & {
    status: 'idle' | 'loading' | 'success' | 'error';
    loadingState?: FC;
    idleState?: FC;
    emptyState?: FC;
    className?: string;
    minimal?: boolean;
    $shouldExpand?: boolean;
    $padding?: number;
    'data-testid'?: string;
};

const Table: FC<Props> = ({
    $shouldExpand,
    $padding,
    status,
    loadingState,
    idleState,
    emptyState,
    className,
    minimal = false,
    'data-testid': dataTestId,
    ...rest
}) => {
    const LoadingState = loadingState || States.LoadingState;
    const IdleState = idleState || States.IdleState;
    const EmptyState = emptyState || States.EmptyState;

    return (
        <TableProvider {...rest}>
            <TableContainer
                className={`sentry-block fs-block cohere-block${
                    className ? ` ${className}` : ''
                }`}
                $shouldExpand={$shouldExpand}
                $padding={$padding}
                data-testid={dataTestId}
            >
                <ScrollableTable minimal={minimal} />
                {status === 'loading' && <LoadingState />}
                {status === 'idle' && <IdleState />}
                {status === 'success' && rest.data.length === 0 && (
                    <EmptyState />
                )}
                <TablePagination />
            </TableContainer>
        </TableProvider>
    );
};

export default Table;
