import { Colors, Icon, Intent, Position } from '@blueprintjs/core';
import { MenuItem2, Tooltip2 } from '@blueprintjs/popover2';
import { InlineErrorType, SummaryExplore } from '@lightdash/common';
import { IconTable } from '@tabler/icons-react';
import React from 'react';
import styled from 'styled-components';

const StyledMenuItem2 = styled(MenuItem2)`
    .menu-item-label-element {
        display: none;
    }

    :hover {
        .menu-item-label-element {
            display: block;
        }
    }

    :active {
        .menu-item-label-element {
            display: none;
        }
    }
`;

type ExploreMenuItemProps = {
    explore: SummaryExplore;
    onClick: () => void;
};

const NoDimensionsIcon = () => (
    <a
        role="button"
        href="https://docs.lightdash.com/guides/how-to-create-dimensions"
        target="_blank"
        rel="noreferrer"
        style={{ color: Colors.GRAY5 }}
    >
        <Icon icon="info-sign" />
    </a>
);

export const ExploreMenuItem: React.FC<ExploreMenuItemProps> = ({
    explore,
    onClick,
}: ExploreMenuItemProps) => {
    if ('errors' in explore) {
        const showNoDimensionsIcon = explore.errors.every(
            (error) => error.type === InlineErrorType.NO_DIMENSIONS_FOUND,
        );
        const errorMessage = explore.errors
            .map((error) => error.message)
            .join('\n');

        return (
            <Tooltip2 content={errorMessage} targetTagName="div">
                <MenuItem2
                    roleStructure="listoption"
                    icon={<IconTable size={20} />}
                    text={explore.label}
                    disabled
                    labelElement={
                        showNoDimensionsIcon ? (
                            <NoDimensionsIcon />
                        ) : (
                            <Icon icon="warning-sign" intent={Intent.WARNING} />
                        )
                    }
                />
            </Tooltip2>
        );
    }
    return (
        <StyledMenuItem2
            roleStructure="listoption"
            icon={<IconTable size={20} />}
            text={explore.label}
            onClick={onClick}
            labelClassName="menu-item-label-element"
            labelElement={
                <Tooltip2
                    position={Position.RIGHT}
                    content={explore.description}
                >
                    <Icon icon="info-sign" />
                </Tooltip2>
            }
        />
    );
};
