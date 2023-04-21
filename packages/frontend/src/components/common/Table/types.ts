import {
    Field,
    PivotReference,
    ResultRow,
    SortField,
    TableCalculation,
} from '@lightdash/common';
import {
    Cell,
    ColumnDef,
    createColumnHelper,
    Header,
} from '@tanstack/react-table';
import { CSSProperties } from 'styled-components';

export type HeaderProps = { header: Header<ResultRow, any> };
export type CellContextMenuProps = {
    cell: Cell<ResultRow, ResultRow[0]>;
    isEditMode?: boolean;
};

export type Sort = {
    sortIndex: number;
    sort: SortField;
    isNumeric: boolean;
    isMultiSort: boolean;
};

export type TableHeader = ColumnDef<ResultRow, unknown>;
export type TableColumn = ColumnDef<ResultRow, ResultRow[0]> & {
    meta?: {
        isInvalidItem?: boolean;
        width?: number;
        draggable?: boolean;
        item?: Field | TableCalculation;
        pivotReference?: PivotReference;
        bgColor?: string;
        sort?: Sort;
        className?: string;
        style?: CSSProperties;
        frozen?: boolean;
    };
};

export const columnHelper = createColumnHelper<ResultRow>();

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 5000;

export const ROW_NUMBER_COLUMN_ID = 'row_number_column';
