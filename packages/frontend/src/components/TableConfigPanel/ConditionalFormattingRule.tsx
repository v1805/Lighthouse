import { Button, FormGroup, HTMLSelect } from '@blueprintjs/core';
import { Tooltip2 } from '@blueprintjs/popover2';
import {
    ConditionalFormattingRule as ConditionalFormattingRuleT,
    ConditionalOperator,
    FilterableItem,
    FilterType,
} from '@lightdash/common';
import { FC, useState } from 'react';
import { FilterTypeConfig } from '../common/Filters/configs';
import {
    ConditionalFormattingGroupTitle,
    ConditionalFormattingRuleGroupHeader,
    ConditionalFormattingRuleWrapper,
} from './ConditionalFormatting.styles';

// conditional formatting only supports number fields for now
const filterConfig = FilterTypeConfig[FilterType.NUMBER];

interface ConditionalFormattingRuleProps {
    isDefaultOpen?: boolean;
    ruleIndex: number;
    rule: ConditionalFormattingRuleT;
    field: FilterableItem;
    hasRemove?: boolean;
    onChangeRule: (newRule: ConditionalFormattingRuleT) => void;
    onChangeRuleOperator: (newOperator: ConditionalOperator) => void;
    onRemoveRule: () => void;
}

const ConditionalFormattingRule: FC<ConditionalFormattingRuleProps> = ({
    isDefaultOpen = true,
    ruleIndex,
    rule,
    field,
    onChangeRule,
    onChangeRuleOperator,
    onRemoveRule,
    hasRemove,
}) => {
    const [isOpen, setIsOpen] = useState(isDefaultOpen);

    return (
        <ConditionalFormattingRuleWrapper>
            <ConditionalFormattingRuleGroupHeader>
                <Button
                    minimal
                    small
                    onClick={() => setIsOpen(!isOpen)}
                    icon={isOpen ? 'chevron-down' : 'chevron-right'}
                />

                <ConditionalFormattingGroupTitle>
                    Condition {ruleIndex + 1}
                </ConditionalFormattingGroupTitle>

                {hasRemove ? (
                    <Tooltip2
                        content="Remove condition"
                        position="left"
                        renderTarget={({ ref, ...tooltipProps }) => (
                            <Button
                                style={{ marginLeft: 'auto' }}
                                {...(tooltipProps as any)}
                                elementRef={ref}
                                minimal
                                small
                                icon="cross"
                                onClick={onRemoveRule}
                            />
                        )}
                    />
                ) : null}
            </ConditionalFormattingRuleGroupHeader>

            {isOpen ? (
                <>
                    <FormGroup>
                        <HTMLSelect
                            fill
                            onChange={(e) =>
                                onChangeRuleOperator(
                                    e.target.value as ConditionalOperator,
                                )
                            }
                            options={filterConfig.operatorOptions}
                            value={rule.operator}
                        />
                    </FormGroup>

                    <FormGroup>
                        <filterConfig.inputs
                            filterType={FilterType.NUMBER}
                            field={field}
                            rule={rule}
                            onChange={onChangeRule}
                        />
                    </FormGroup>
                </>
            ) : null}
        </ConditionalFormattingRuleWrapper>
    );
};

export default ConditionalFormattingRule;
