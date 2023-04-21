import {
    Button,
    Card,
    Collapse,
    Colors,
    H3,
    HTMLSelect,
    Icon,
    Tag,
} from '@blueprintjs/core';
import { IconLayoutDashboard } from '@tabler/icons-react';
import styled, { css } from 'styled-components';

export const Header = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
`;

export const TitleWrapper = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    flex: 1;
    justify-content: flex-start;
`;

export const Title = styled(H3)<{ marginBottom?: boolean }>`
    margin: 0;
    margin-right: 10px;

    ${({ marginBottom }) =>
        marginBottom &&
        css`
            margin: 0 0 20px;
        `}
`;
export const CardWrapper = styled(Card)`
    padding: 20px;
    margin-top: 20px;
    cursor: pointer;
`;

export const CardContent = styled.div`
    display: flex;
    gap: 10px;
    height: 24px;
`;
