import { Colors, HTMLTable } from '@blueprintjs/core';
import { darken, transparentize } from 'polished';
import styled, { css } from 'styled-components';

export const TABLE_HEADER_BG = Colors.LIGHT_GRAY4;
export const getTableHeaderDarkerBg = (depth: number) =>
    darken(depth * 0.03, TABLE_HEADER_BG);

export const TableScrollableWrapper = styled.div`
    display: flex;
    flex-direction: column;

    position: relative;
    overflow: auto;
    min-width: 100%;
`;

interface TableContainerProps {
    $shouldExpand?: boolean;
    $padding?: number;
}

export const TableContainer = styled.div<TableContainerProps>`
    display: flex;
    flex-direction: column;
    padding: ${({ $padding = 10 }) => `${$padding}px`};
    min-width: 100%;
    overflow: hidden;

    ${({ $shouldExpand }) =>
        $shouldExpand
            ? `
                height: inherit;
            `
            : `
                max-height: 800px;
            `}
`;

export const Table = styled(HTMLTable)<{ $showFooter: boolean }>`
    background-color: white;
    width: 100%;
    border-left: 1px solid #dcdcdd;
    border-right: 1px solid #dcdcdd;

    ${({ $showFooter }) =>
        !$showFooter ? ` border-bottom: 1px solid #dcdcdd;` : undefined}

    thead {
        z-index: 2;
        position: sticky;
        top: 0;
        inset-block-start: 0; /* "top" */

        th:first-child {
            border-top: none !important;
            border-bottom: none !important;
        }

        th {
            border-top: none !important;
            border-bottom: none !important;
        }
    }

    tfoot {
        position: sticky;
        z-index: 3;
        bottom: 0;
        inset-block-end: 0; /* "bottom" */

        th:first-child {
            border-top: none !important;
            border-bottom: none !important;
        }

        th {
            border-top: none !important;
            border-bottom: none !important;
            box-shadow: inset 0 1px 0 #dcdcdd, inset 0 -1px 0 #dcdcdd,
                inset 1px 0 0 0 rgb(17 20 24 / 15%) !important;
        }
    }

    .sticky-column {
        position: sticky !important;
        left: 1px;
        z-index: 1;
        background-color: white;
        word-break: break-word;
    }
    .first-sticky-column {
        box-shadow: lightgray -1px 0px 0px 0px, lightgray 0px 1px 0px 0px inset !important;
    }
    .last-sticky-column {
        border-right: 2px solid darkgray;
    }
`;

Table.defaultProps = {
    compact: true,
    bordered: true,
    striped: false,
};

export const TableFooter = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
`;

const CellStyles = css<{ $isNaN: boolean }>`
    text-align: ${({ $isNaN }) => ($isNaN ? 'left' : 'right')} !important;
`;

export const Tr = styled.tr<{
    $index?: number;
}>`
    ${({ $index = 0 }) =>
        $index % 2 === 1
            ? `
                background-color: ${transparentize(0.7, Colors.LIGHT_GRAY5)};
            `
            : ''}

    :hover {
        background-color: ${Colors.LIGHT_GRAY3} !important;
    }

    :hover td {
        filter: saturate(1) brightness(0.9);
    }
`;

export const Td = styled.td<{
    $isNaN: boolean;
    $rowIndex: number;
    $isSelected: boolean;
    $isInteractive: boolean;
    $isCopying: boolean;
    $backgroundColor?: string;
    $fontColor?: string;
    $hasData: boolean;
}>`
    ${CellStyles}

    ${({ $isInteractive, $hasData }) =>
        $isInteractive && $hasData
            ? `
                cursor: pointer;
            `
            : ''}

    ${({ $isSelected }) =>
        $isSelected
            ? `
                position: relative;
                z-index: 21;
            `
            : ''}

    ${({ $backgroundColor }) =>
        $backgroundColor
            ? `
                background-color: ${$backgroundColor} !important;
            `
            : ''}

    ${({ $fontColor }) =>
        $fontColor
            ? `
                color: ${$fontColor} !important;
            `
            : ''}

    filter: saturate(1) brightness(1);
    transition: filter 0.15s linear;

    ${({ $isInteractive, $isSelected, $hasData, $backgroundColor }) =>
        $isInteractive && $isSelected && $hasData
            ? `
                    box-shadow: inset 0 0 0 1px #4170CB !important;
                    ${
                        $backgroundColor
                            ? 'filter: saturate(1) brightness(0.8) !important;'
                            : `background-color: #ECF6FE !important;`
                    }
                `
            : ''}

    ${({ $isCopying }) =>
        $isCopying
            ? `filter: saturate(2) brightness(1) !important`
            : 'filter: initial'}
`;

export const FooterCell = styled.th<{ $isNaN: boolean }>`
    ${CellStyles}
    ${() =>
        `
        background-color: ${Colors.WHITE}
  `}
`;

export const PaginationWrapper = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
`;

export const PageCount = styled.span`
    color: ${Colors.GRAY1};
    font-size: 12px;
`;

export const Th = styled.th``;

export const ThContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: flex-start;
`;

export const ThLabelContainer = styled.div``;

export const ThActionsContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;

    margin-left: 5px;
    > *:not(:last-child) {
        margin-right: 10px;
    }
`;

export const TableHeaderLabelContainer = styled.div``;

export const TableHeaderRegularLabel = styled.span`
    font-weight: 400;
    opacity: 0.7;
`;

export const TableHeaderBoldLabel = styled.span`
    font-weight: 600;
`;
