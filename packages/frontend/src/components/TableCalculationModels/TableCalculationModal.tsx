import { Button, Callout, Classes, Intent } from '@blueprintjs/core';
import {
    hasSpecialCharacters,
    snakeCaseName,
    TableCalculation,
} from '@lightdash/common';
import React, { FC } from 'react';
import { useForm } from 'react-hook-form';
import { useToggle } from 'react-use';
import useToaster from '../../hooks/toaster/useToaster';
import { useExplorerAceEditorCompleter } from '../../hooks/useExplorerAceEditorCompleter';
import { useExplorerContext } from '../../providers/ExplorerProvider';
import Input from '../ReactHookForm/Input';
import SqlInput from '../ReactHookForm/SqlInput';
import {
    DialogBody,
    DialogButtons,
    FlexForm,
    FullScreenButton,
    TableCalculationDialog,
    TableCalculationSqlInputWrapper,
} from './TableCalculationModal.styles';

const SQL_PLACEHOLDER =
    // eslint-disable-next-line no-template-curly-in-string
    '${table_name.field_name} + ${table_name.metric_name}';

interface Props {
    isOpen: boolean;
    isDisabled: boolean;
    tableCalculation?: TableCalculation;
    onSave: (tableCalculation: TableCalculation) => void;
    onClose: () => void;
}

type TableCalculationFormInputs = {
    name: string;
    sql: string;
};

const getUniqueTableCalculationName = (
    name: string,
    tableCalculations: TableCalculation[],
): string => {
    const snakeName = snakeCaseName(name);
    const suffixes = Array.from(Array(100).keys());
    const getCalcName = (suffix: number) =>
        suffix === 0 ? snakeName : `${snakeName}_${suffix}`;

    const validSuffix = suffixes.find(
        (suffix) =>
            tableCalculations.findIndex(
                ({ name: tableCalcName }) =>
                    tableCalcName === getCalcName(suffix),
            ) === -1,
    );
    if (validSuffix === undefined) {
        throw new Error(`Table calculation ID "${name}" already exists.`);
    }
    return getCalcName(validSuffix);
};

const TableCalculationModal: FC<Props> = ({
    isOpen,
    isDisabled,
    tableCalculation,
    onSave,
    onClose,
}) => {
    const [isFullscreen, toggleFullscreen] = useToggle(false);
    const { showToastError } = useToaster();
    const tableName = useExplorerContext(
        (context) => context.state.unsavedChartVersion.tableName,
    );
    const dimensions = useExplorerContext(
        (context) => context.state.unsavedChartVersion.metricQuery.dimensions,
    );
    const metrics = useExplorerContext(
        (context) => context.state.unsavedChartVersion.metricQuery.metrics,
    );
    const tableCalculations = useExplorerContext(
        (context) =>
            context.state.unsavedChartVersion.metricQuery.tableCalculations,
    );
    const { setAceEditor } = useExplorerAceEditorCompleter();
    const methods = useForm<TableCalculationFormInputs>({
        mode: 'onSubmit',
        defaultValues: {
            name: tableCalculation?.displayName,
            sql: tableCalculation?.sql,
        },
    });

    return (
        <TableCalculationDialog
            isOpen={isOpen}
            onClose={() => (!isDisabled ? onClose() : undefined)}
            title={
                tableCalculation
                    ? 'Edit table calculation'
                    : 'Add table calculation'
            }
            lazy
            style={
                isFullscreen
                    ? {
                          position: 'absolute',
                          width: '100%',
                          height: '100%',
                      }
                    : undefined
            }
        >
            <FlexForm
                name="table_calculation"
                methods={methods}
                onSubmit={(data: TableCalculationFormInputs) => {
                    const { name, sql } = data;
                    try {
                        onSave({
                            name: getUniqueTableCalculationName(
                                name,
                                tableCalculations,
                            ),
                            displayName: name,
                            sql,
                        });
                    } catch (e: any) {
                        showToastError({
                            title: 'Error saving',
                            subtitle: e.message,
                        });
                    }
                }}
            >
                <DialogBody className={Classes.DIALOG_BODY}>
                    <Input
                        label="Name"
                        name="name"
                        disabled={isDisabled}
                        rules={{
                            required: true,
                            validate: {
                                unique_column_name: (columnName) =>
                                    !dimensions
                                        .concat(metrics)
                                        .concat(
                                            tableCalculations
                                                .filter(
                                                    ({ name }) =>
                                                        !tableCalculation ||
                                                        name !==
                                                            tableCalculation.name,
                                                )
                                                .map(
                                                    ({ displayName }) =>
                                                        displayName,
                                                ),
                                        )
                                        .some(
                                            (fieldName) =>
                                                fieldName ===
                                                snakeCaseName(columnName),
                                        ) ||
                                    'Column with same name already exists',
                            },
                        }}
                    />
                    <TableCalculationSqlInputWrapper
                        $isFullScreen={isFullscreen}
                    >
                        <SqlInput
                            name="sql"
                            label="SQL"
                            attributes={{
                                readOnly: isDisabled,
                                height: '100%',
                                width: '100%',
                                maxLines: isFullscreen ? 40 : 20,
                                minLines: isFullscreen ? 40 : 8,
                                editorProps: { $blockScrolling: true },
                                enableBasicAutocompletion: true,
                                enableLiveAutocompletion: true,
                                onLoad: setAceEditor,
                                wrapEnabled: true,
                            }}
                            placeholder={SQL_PLACEHOLDER}
                        />
                    </TableCalculationSqlInputWrapper>
                    <Callout intent="none" icon="clean">
                        <p>
                            Need inspiration?{' '}
                            <a
                                target="_blank"
                                href="https://docs.lightdash.com/guides/table-calculations/sql-templates"
                                rel="noreferrer"
                            >
                                Check out our templates!
                            </a>
                        </p>
                    </Callout>
                </DialogBody>
                <div className={Classes.DIALOG_FOOTER}>
                    <DialogButtons className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <FullScreenButton
                            icon={isFullscreen ? 'minimize' : 'fullscreen'}
                            onClick={toggleFullscreen}
                        ></FullScreenButton>
                        <Button onClick={onClose}>Cancel</Button>
                        <Button
                            type="submit"
                            intent={Intent.PRIMARY}
                            text="Save"
                            loading={isDisabled}
                        />
                    </DialogButtons>
                </div>
            </FlexForm>
        </TableCalculationDialog>
    );
};

export default TableCalculationModal;
