import { Colors, H4, Icon } from '@blueprintjs/core';
import styled from 'styled-components';

export const PAGE_HEADER_HEIGHT = 80;

export const PageHeaderContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    height: ${PAGE_HEADER_HEIGHT}px;
    width: 100%;
    position: relative;
    z-index: 1;
    background: ${Colors.WHITE};
    border-bottom: 0.5px solid #c5cbd3;
    padding: 15px 20px 15px 20px;
`;

export const PageTitleAndDetailsContainer = styled.div`
    flex: 1;
`;

export const PageTitle = styled(H4)`
    margin: 4px 5px 4px 0;
`;

export const PageTitleContainer = styled.div`
    display: flex;
    align-items: center;
`;

export const PageDetailsContainer = styled.div`
    margin-top: 0.38em;
    display: flex;
    align-items: center;
    color: ${Colors.GRAY2};
    font-size: 12px;
    font-weight: 400;
    line-height: 14px;
`;

export const SeparatorDot = styled(Icon)`
    margin-left: 11px;
    margin-right: 11px;
    color: ${Colors.GRAY4};
`;

export const InfoContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;

    color: ${Colors.GRAY2};
    font-size: 12px;
    line-height: 14px;

    svg: {
        stroke: ${Colors.GRAY2} !important;
    }
`;

export const UpdatedInfoLabel = styled.p`
    color: ${Colors.GRAY2};
    font-size: 12px;
    font-weight: 400;
    line-height: 14px;
    margin-bottom: 0;
`;

export const PageActionsContainer = styled.div`
    display: flex;
    > *:not(:last-child) {
        margin-right: 10px;
    }
`;
