import {
    Button,
    Classes,
    Colors,
    KeyCombo,
    Spinner,
    Tag,
} from '@blueprintjs/core';
import { MenuItem2 } from '@blueprintjs/popover2';
import { ItemPredicate, ItemRenderer } from '@blueprintjs/select';
import { getSearchResultId } from '@lightdash/common';
import React, { FC, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useToggle } from 'react-use';
import { useProject } from '../../../hooks/useProject';
import { useTracking } from '../../../providers/TrackingProvider';
import { EventName } from '../../../types/Events';
import FieldIcon from '../../common/Filters/FieldIcon';
import HighlightedText from '../../common/HighlightedText';
import {
    FirstLine,
    Hightlighed,
    ResultContent,
    SearchInput,
    SearchOmnibar,
    SecondLine,
} from './globalSearch.styles';
import {
    SearchItem,
    useDebouncedSearch,
    useGlobalSearchHotKeys,
} from './hooks';
import { SearchIcon } from './SearchIcon';

const renderItem: ItemRenderer<SearchItem> = (
    field,
    { modifiers, handleClick, query },
) => {
    if (!modifiers.matchesPredicate) {
        return null;
    }
    return (
        <MenuItem2
            key={getSearchResultId(field.meta)}
            selected={modifiers.active}
            disabled={modifiers.disabled}
            icon={<SearchIcon item={field} color={Colors.GRAY1} />}
            text={
                <ResultContent>
                    <FirstLine>
                        <span>{field.prefix}</span>
                        <b>
                            <HighlightedText
                                text={field.name}
                                query={query}
                                highlightElement={Hightlighed}
                            />
                        </b>
                    </FirstLine>
                    <SecondLine className={Classes.TEXT_OVERFLOW_ELLIPSIS}>
                        <b>{field.typeLabel}</b>
                        {field.description ? (
                            <>
                                {' '}
                                •{' '}
                                <HighlightedText
                                    text={field.description}
                                    query={query}
                                    highlightElement={Hightlighed}
                                />
                            </>
                        ) : null}
                    </SecondLine>
                </ResultContent>
            }
            onClick={handleClick}
        />
    );
};

const filterSearch: ItemPredicate<SearchItem> = (query, item) => {
    return (
        `${item.name.toLowerCase()} ${item.description?.toLowerCase()}`.indexOf(
            query.toLowerCase(),
        ) >= 0
    );
};

const GlobalSearch: FC<{ projectUuid: string }> = ({ projectUuid }) => {
    const history = useHistory();
    const location = useLocation();
    const { track } = useTracking();
    const [isSearchOpen, toggleSearchOpen] = useToggle(false);
    const [query, setQuery] = useState<string>();
    const project = useProject(projectUuid);
    useGlobalSearchHotKeys(toggleSearchOpen);
    const { items, isSearching } = useDebouncedSearch(projectUuid, query);
    return (
        <>
            <SearchInput
                leftIcon="search"
                onClick={() => {
                    track({
                        name: EventName.GLOBAL_SEARCH_OPEN,
                        properties: {
                            action: 'input_click',
                        },
                    });
                    toggleSearchOpen(true);
                }}
                placeholder="Search..."
                value={query}
                rightElement={
                    query ? (
                        <Button icon="cross" onClick={() => setQuery('')} />
                    ) : (
                        <Tag minimal>
                            <KeyCombo combo="mod+k" minimal />
                        </Tag>
                    )
                }
            />
            <SearchOmnibar
                inputProps={{
                    placeholder: `Search ${project.data?.name}...`,
                    leftElement: isSearching ? (
                        <Spinner size={16} style={{ margin: 12 }} />
                    ) : undefined,
                }}
                isOpen={isSearchOpen}
                itemRenderer={renderItem}
                query={query}
                items={query && query.length > 2 ? items : []}
                itemsEqual={(a, b) =>
                    getSearchResultId(a.meta) === getSearchResultId(b.meta)
                }
                initialContent={
                    <MenuItem2
                        disabled={true}
                        text={`${
                            !query ? 'Start' : 'Keep'
                        } typing to search by a space, dashboard, chart, table or field in this project`}
                    />
                }
                noResults={
                    <MenuItem2
                        disabled={true}
                        text={
                            !query || query.length < 3
                                ? `${
                                      !query ? 'Start' : 'Keep'
                                  } typing to search everything in the project`
                                : isSearching
                                ? 'Searching...'
                                : 'No results.'
                        }
                    />
                }
                onItemSelect={(item: SearchItem) => {
                    track({
                        name: EventName.SEARCH_RESULT_CLICKED,
                        properties: {
                            type: item.type,
                            id: getSearchResultId(item.meta),
                        },
                    });
                    track({
                        name: EventName.GLOBAL_SEARCH_CLOSED,
                        properties: {
                            action: 'result_click',
                        },
                    });
                    toggleSearchOpen(false);
                    history.push(item.location);
                    if (
                        (item.location.pathname.includes('/tables/') &&
                            location.pathname.includes('/tables/')) ||
                        (item.location.pathname.includes('/saved/') &&
                            location.pathname.includes('/saved/'))
                    ) {
                        history.go(0); // force page refresh so explore page can pick up the new url params
                    }
                }}
                onClose={() => {
                    track({
                        name: EventName.GLOBAL_SEARCH_CLOSED,
                        properties: {
                            action: 'default',
                        },
                    });
                    toggleSearchOpen(false);
                }}
                resetOnSelect={true}
                onQueryChange={(value) => setQuery(value)}
                itemPredicate={filterSearch}
            />
        </>
    );
};

export default GlobalSearch;
