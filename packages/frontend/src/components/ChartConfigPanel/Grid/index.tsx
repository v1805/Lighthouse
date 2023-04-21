import { FormGroup } from '@blueprintjs/core';
import { EchartsGrid } from '@lightdash/common';
import startCase from 'lodash/startCase';
import { FC, useMemo } from 'react';
import UnitInput from '../../common/UnitInput';
import { useVisualizationContext } from '../../LightdashVisualization/VisualizationProvider';
import { SectionRow } from './Grid.styles';

export const defaultGrid = {
    containLabel: true,
    left: '5%', // small padding
    right: '5%', // small padding
    top: '70px', // pixels from top (makes room for legend)
    bottom: '30px', // pixels from bottom (makes room for x-axis)
};

enum Positions {
    Left = 'left',
    Right = 'right',
    Top = 'top',
    Bottom = 'bottom',
}

enum Units {
    Pixels = 'px',
    Percentage = '%',
}

const units = Object.values(Units);

const GridPanel: FC = () => {
    const {
        cartesianConfig: { dirtyEchartsConfig, setGrid },
    } = useVisualizationContext();

    const config = useMemo<EchartsGrid>(
        () => ({
            ...defaultGrid,
            ...dirtyEchartsConfig?.grid,
        }),
        [dirtyEchartsConfig?.grid],
    );

    const handleUpdate = (
        position: Positions,
        newValue: string | undefined,
    ) => {
        const newState = { ...config, [position]: newValue };
        setGrid(newState);
        return newState;
    };

    return (
        <>
            {[
                [Positions.Left, Positions.Right],
                [Positions.Top, Positions.Bottom],
            ].map((positionGroup) => (
                <SectionRow key={positionGroup.join(',')}>
                    {positionGroup.map((position) => (
                        <FormGroup
                            key={position}
                            label={startCase(position)}
                            labelFor={`${position}-input`}
                        >
                            <UnitInput
                                name={position}
                                units={units}
                                value={config[position] || ''}
                                defaultValue={defaultGrid[position]}
                                onChange={(value) =>
                                    handleUpdate(position, value)
                                }
                            />
                        </FormGroup>
                    ))}
                </SectionRow>
            ))}
        </>
    );
};

export default GridPanel;
