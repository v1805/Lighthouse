import { Callout, H5, Tabs } from '@blueprintjs/core';
import { Tooltip2 } from '@blueprintjs/popover2';
import styled from 'styled-components';

export const Title = styled(H5)`
    padding-left: 10px;
`;

export const SideBarWrapper = styled.div`
    overflow-y: auto;
`;

export const MissingTablesInfo = styled(Tooltip2)`
    width: 100%;
`;

export const ButtonsWrapper = styled.div`
    height: 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    button {
        margin: 0;
    }
`;

export const SqlCallout = styled(Callout)`
    margin-top: 20px;
`;

// @ts-ignore
export const StyledTabs = styled(Tabs)`
    margin-bottom: 10px;
`;
