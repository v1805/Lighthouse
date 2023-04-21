import { FC, useRef } from 'react';
import { Table, TableScrollableWrapper } from '../Table.styles';
import { useTableContext } from '../TableProvider';
import TableBody from './TableBody';
import TableFooter from './TableFooter';
import TableHeader from './TableHeader';

interface ScrollableTableProps {
    minimal?: boolean;
}

const ScrollableTable: FC<ScrollableTableProps> = ({ minimal = true }) => {
    const { footer } = useTableContext();
    const tableContainerRef = useRef<HTMLDivElement>(null);

    return (
        <TableScrollableWrapper ref={tableContainerRef}>
            <Table $showFooter={!!footer?.show}>
                <TableHeader minimal={minimal} />
                <TableBody
                    tableContainerRef={tableContainerRef}
                    minimal={minimal}
                />
                <TableFooter />
            </Table>
        </TableScrollableWrapper>
    );
};

export default ScrollableTable;
