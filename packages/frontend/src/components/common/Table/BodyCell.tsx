import { mergeRefs, Position } from '@blueprintjs/core';
import { Popover2, Tooltip2 } from '@blueprintjs/popover2';
import { ResultRow } from '@lightdash/common';
import { Cell } from '@tanstack/react-table';
import { FC } from 'react';
import { CSSProperties } from 'styled-components';
import RichBodyCell from './ScrollableTable/RichBodyCell';
import { Td } from './Table.styles';
import { CellContextMenuProps } from './types';

interface CommonBodyCellProps {
    cell: Cell<ResultRow, unknown>;
    index: number;
    isNumericItem: boolean;
    hasData: boolean;
    cellContextMenu?: FC<CellContextMenuProps>;
    className?: string;
    style?: CSSProperties;
    backgroundColor?: string;
    fontColor?: string;
    copying?: boolean;
    selected?: boolean;
    tooltipContent?: string;
    minimal?: boolean;
    onSelect: () => void;
    onDeselect: () => void;
    onKeyDown: React.KeyboardEventHandler<HTMLElement>;
}

const BodyCell: FC<CommonBodyCellProps> = ({
    cell,
    cellContextMenu,
    children,
    className,
    backgroundColor,
    fontColor,
    copying = false,
    hasData,
    isNumericItem,
    index,
    selected = false,
    style,
    tooltipContent,
    minimal = false,
    onSelect,
    onDeselect,
    onKeyDown,
}) => {
    const CellContextMenu = cellContextMenu;

    const hasContextMenu = hasData && !!CellContextMenu;

    const handleSelect = () => {
        if (!hasContextMenu) return;
        onSelect();
    };

    const handleDeselect = () => {
        onDeselect();
    };

    return (
        <Popover2
            isOpen={selected}
            lazy
            minimal
            position={Position.BOTTOM_RIGHT}
            hasBackdrop
            backdropProps={{ onClick: handleDeselect }}
            onOpening={() => handleSelect()}
            onClose={() => handleDeselect()}
            content={
                CellContextMenu && (
                    <CellContextMenu
                        cell={cell as Cell<ResultRow, ResultRow[0]>}
                    />
                )
            }
            renderTarget={({ ref: ref2, ...popoverProps }) => (
                <Tooltip2
                    lazy
                    position={Position.TOP}
                    disabled={!tooltipContent || minimal}
                    content={tooltipContent}
                    renderTarget={({ ref: ref1, ...tooltipProps }) => (
                        <Td
                            ref={mergeRefs(ref1, ref2)}
                            {...(tooltipProps as any)}
                            {...popoverProps}
                            className={className}
                            style={style}
                            $rowIndex={index}
                            $isSelected={selected}
                            $isInteractive={hasContextMenu}
                            $isCopying={copying}
                            $backgroundColor={backgroundColor}
                            $fontColor={fontColor}
                            $hasData={hasContextMenu}
                            $isNaN={!hasData || !isNumericItem}
                            onClick={selected ? handleDeselect : handleSelect}
                            onKeyDown={onKeyDown}
                        >
                            <RichBodyCell
                                cell={cell as Cell<ResultRow, ResultRow[0]>}
                            >
                                {children}
                            </RichBodyCell>
                        </Td>
                    )}
                />
            )}
        />
    );
};

export default BodyCell;
