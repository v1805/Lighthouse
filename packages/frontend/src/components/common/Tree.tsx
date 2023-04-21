import { Tree as BlueprintTree, TreeNodeInfo } from '@blueprintjs/core';
import * as React from 'react';

type NodePath = number[];

type TreeAction =
    | {
          type: 'SET_IS_EXPANDED';
          payload: { path: NodePath; isExpanded: boolean };
      }
    | { type: 'DESELECT_ALL' }
    | {
          type: 'SET_IS_SELECTED';
          payload: { path: NodePath; isSelected: boolean };
      };

function forEachNode(
    nodes: TreeNodeInfo[] | undefined,
    callback: (node: TreeNodeInfo) => void,
) {
    if (nodes === undefined) {
        return;
    }

    nodes.forEach((node) => {
        callback(node);
        forEachNode(node.childNodes, callback);
    });
}

function forNodeAtPath(
    nodes: TreeNodeInfo[],
    path: NodePath,
    callback: (node: TreeNodeInfo) => void,
) {
    callback(BlueprintTree.nodeFromPath(path, nodes));
}

function treeReducer(state: TreeNodeInfo[], action: TreeAction) {
    switch (action.type) {
        case 'DESELECT_ALL': {
            const newState1 = [...state];
            forEachNode(newState1, (node) => {
                // eslint-disable-next-line no-param-reassign
                node.isSelected = false;
            });
            return newState1;
        }
        case 'SET_IS_EXPANDED': {
            const newState2 = [...state];
            forNodeAtPath(newState2, action.payload.path, (node) => {
                // eslint-disable-next-line no-param-reassign
                node.isExpanded = action.payload.isExpanded;
            });
            return newState2;
        }
        case 'SET_IS_SELECTED': {
            const newState3 = [...state];
            forNodeAtPath(newState3, action.payload.path, (node) => {
                // eslint-disable-next-line no-param-reassign
                node.isSelected = action.payload.isSelected;
            });
            return newState3;
        }
        default:
            return state;
    }
}

enum SqlRunnerCards {
    CHART = 'CHART',
    SQL = 'SQL',
    RESULTS = 'RESULTS',
}

// Note: this code is based on blueprint example https://github.com/palantir/blueprint/blob/develop/packages/docs-app/src/examples/core-examples/treeExample.tsx
export const Tree: React.FC<{
    setExpandedCards: React.Dispatch<
        React.SetStateAction<Map<SqlRunnerCards, boolean>>
    >;
    contents: TreeNodeInfo[];
    handleSelect: boolean;
    onNodeClick?: (
        node: TreeNodeInfo,
        nodePath: NodePath,
        e: React.MouseEvent<HTMLElement>,
    ) => void;
}> = ({ setExpandedCards, contents, handleSelect, onNodeClick }) => {
    const [nodes, dispatch] = React.useReducer(treeReducer, contents);

    const handleCardExpandOnNodeClick = React.useCallback(
        (card: SqlRunnerCards, value: boolean) => {
            setExpandedCards((prev) => new Map(prev).set(card, value));
        },
        [setExpandedCards],
    );

    const handleNodeClick = React.useCallback(
        (
            node: TreeNodeInfo,
            nodePath: NodePath,
            e: React.MouseEvent<HTMLElement>,
        ) => {
            handleCardExpandOnNodeClick(SqlRunnerCards.SQL, true);
            if (handleSelect) {
                const originallySelected = node.isSelected;
                if (!e.shiftKey) {
                    dispatch({ type: 'DESELECT_ALL' });
                }
                dispatch({
                    payload: {
                        path: nodePath,
                        isSelected:
                            originallySelected == null
                                ? true
                                : !originallySelected,
                    },
                    type: 'SET_IS_SELECTED',
                });
            }
            onNodeClick?.(node, nodePath, e);
        },
        [handleCardExpandOnNodeClick, handleSelect, onNodeClick],
    );

    const handleNodeCollapse = React.useCallback(
        (_node: TreeNodeInfo, nodePath: NodePath) => {
            dispatch({
                payload: { path: nodePath, isExpanded: false },
                type: 'SET_IS_EXPANDED',
            });
        },
        [],
    );

    const handleNodeExpand = React.useCallback(
        (_node: TreeNodeInfo, nodePath: NodePath) => {
            dispatch({
                payload: { path: nodePath, isExpanded: true },
                type: 'SET_IS_EXPANDED',
            });
        },
        [],
    );

    return (
        <BlueprintTree
            contents={nodes}
            onNodeClick={handleNodeClick}
            onNodeCollapse={handleNodeCollapse}
            onNodeExpand={handleNodeExpand}
        />
    );
};
