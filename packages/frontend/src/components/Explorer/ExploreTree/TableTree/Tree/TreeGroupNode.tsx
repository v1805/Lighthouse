import { Collapse, Colors, Intent, Tag, Text } from '@blueprintjs/core';
import { hasIntersection } from '@lightdash/common';
import { intersectionBy } from 'lodash-es';
import { FC } from 'react';
import { useToggle } from 'react-use';
import HighlightedText from '../../../../common/HighlightedText';
import { Highlighted, Row, RowIcon } from '../TableTree.styles';
import TreeNodes from './TreeNodes';
import { GroupNode, Node, useTableTreeContext } from './TreeProvider';

const getAllChildrenKeys = (nodes: Node[]): string[] => {
    return nodes.flatMap(function loop(node): string[] {
        if (node.children) return Object.values(node.children).flatMap(loop);
        else return [node.key];
    });
};

const TreeGroupNode: FC<{ node: GroupNode; depth: number }> = ({
    node,
    depth,
}) => {
    const { selectedItems, isSearching, searchQuery, searchResults } =
        useTableTreeContext();
    const [isOpen, toggle] = useToggle(false);
    const allChildrenKeys: string[] = getAllChildrenKeys([node]);
    const hasSelectedChildren = hasIntersection(
        allChildrenKeys,
        Array.from(selectedItems),
    );
    const selectedChildrenCount = intersectionBy(
        allChildrenKeys,
        Array.from(selectedItems),
    ).length;
    const hasVisibleChildren =
        !isSearching ||
        hasIntersection(allChildrenKeys, Array.from(searchResults));
    const forceOpen = isSearching && hasVisibleChildren;

    if (!hasVisibleChildren) {
        return null;
    }

    return (
        <>
            <Row depth={depth} onClick={toggle}>
                <RowIcon
                    icon={
                        isOpen || forceOpen ? 'chevron-down' : 'chevron-right'
                    }
                    size={16}
                />
                <Text ellipsize>
                    <HighlightedText
                        text={node.label}
                        query={searchQuery || ''}
                        highlightElement={Highlighted}
                    />
                </Text>
                {!isOpen && hasSelectedChildren && (
                    <Tag
                        round
                        minimal
                        intent={Intent.PRIMARY}
                        style={{ marginLeft: '10px' }}
                    >
                        {selectedChildrenCount}
                    </Tag>
                )}
            </Row>

            <Collapse isOpen={isOpen || forceOpen}>
                <TreeNodes nodeMap={node.children} depth={depth + 1} />
            </Collapse>
        </>
    );
};

export default TreeGroupNode;
