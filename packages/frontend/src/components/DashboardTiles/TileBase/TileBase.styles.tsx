import { Card, Colors, H5 } from '@blueprintjs/core';
import styled, { createGlobalStyle, css } from 'styled-components';

interface HeaderContainerProps {
    $isEditMode: boolean;
    $isHovering?: boolean;
}

export const TileBaseWrapper = styled.div<HeaderContainerProps>`
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 16px;
    background: ${Colors.WHITE};
    border-radius: 2px;
    box-shadow: 0 0 0 1px #11141826;

    ${(props) =>
        props.$isEditMode && props.$isHovering
            ? `
                box-shadow: 0 0 0 1px ${Colors.GRAY4};
            `
            : ''}
`;

export const TILE_HEADER_HEIGHT = 24;
export const TILE_HEADER_MARGIN_BOTTOM = 12;

export const HeaderContainer = styled.div<HeaderContainerProps>`
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 8px;
    height: ${TILE_HEADER_HEIGHT}px;
    margin-bottom: ${TILE_HEADER_MARGIN_BOTTOM}px;

    ${(props) =>
        props.$isEditMode
            ? `
                &:hover {
                    cursor: grab;
                }
                &:active, &:focus {
                    cursor: grabbing;
                }
            `
            : ''}
`;

export const GlobalTileStyles = createGlobalStyle`
  .react-draggable.react-draggable-dragging ${TileBaseWrapper} {
    box-shadow: 0 0 0 1px ${Colors.BLUE4};
  }
`;

interface TileTitleProps {
    $hovered?: boolean;
}

export const TitleWrapper = styled.div<TileTitleProps>`
    flex-grow: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    position: relative;

    &:hover {
        ${({ $hovered }) =>
            $hovered
                ? css`
                      white-space: normal;
                      overflow: visible;
                      z-index: 1;

                      a {
                          outline: 8px solid ${Colors.WHITE};
                          background-color: ${Colors.WHITE};
                      }
                  `
                : ''}
        }
    }
`;

export const TileTitleLink = styled.a<TileTitleProps>`
    font-weight: 600;
    font-size: 16px;
    color: ${Colors.DARK_GRAY1};
    text-decoration: none;

    :hover {
        color: ${Colors.DARK_GRAY1} !important;
    }

    ${({ $hovered }) =>
        css`
            ${$hovered
                ? css`
                      text-decoration: underline;
                  `
                : ''}

            &:not([href]) {
                cursor: default;
                text-decoration: none;

                &:hover {
                    ${$hovered
                        ? css`
                              text-decoration: none;
                          `
                        : ''}
                }
            }
        `}
`;

export const ButtonsWrapper = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    gap: 8px;
`;

export const ChartContainer = styled.div`
    flex: 1;
    overflow: hidden;
    display: flex;
`;

export const TooltipContent = styled.p`
    max-width: 400px;
    margin: 0;
`;

export const FilterWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const FilterLabel = styled.p`
    margin-bottom: 5px;
    color: ${Colors.GRAY5};
    font-size: 12px;
    font-weight: 500;
`;
