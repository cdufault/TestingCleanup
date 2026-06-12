import MenuItem from '@mui/material/MenuItem/MenuItem';
import React, { useContext, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { InputField } from '../../../common';
import { getStratComSymbolSet, StratcomSymbol } from '../helpers/SymbolChooserHelper';
import { StyledSymbolImage, StyledSymbolPaper, StyledSymbolText } from '../styles';
import { PointObject3D } from '../helpers/GraphicsHelper';
import { MapContext } from '../../../../contexts/Map';
import { useSnackbar } from 'notistack';

interface SymbolChooserProps {
    onChange: (newSymbol: PointObject3D) => void;
    selectedSymbol: PointObject3D;
}

const SymbolChooser = (props: SymbolChooserProps): JSX.Element => {
    const { onChange, selectedSymbol } = props;

    const [newSymbol, setNewSymbol] = useState<string>();
    //connecting to the webmap view

    const { activeView } = useContext(MapContext);
    const { enqueueSnackbar } = useSnackbar();

    const primitiveSymbols = [
        { name: 'sphere', title: 'Sphere' },
        { name: 'cylinder', title: 'Cylinder' },
        { name: 'cube', title: 'Cube' },
        { name: 'cone', title: 'Cone' },
        { name: 'inverted-cone', title: 'Cone (Inverted)' },
        { name: 'diamond', title: 'Diamond' },
        { name: 'tetrahedron', title: 'Tetrahedron' },
    ];

    const [stratcomSymbols, setStratcomSymbols] = useState<StratcomSymbol[]>();

    function handle3DSymbolErrorIn2DView(): void {
        //whenever the active view of the webmap is MAP or 2D, a snackbar error message will appear
        if (activeView === 'MAP') {
            // Each unique-value row renders its own SymbolChooser, so without deduping this fires
            // once per row. A stable key + preventDuplicate ensures the user only sees it once.
            enqueueSnackbar('Cannot set 3D symbols while in 2D map view', {
                variant: 'error',
                key: 'cannot-set-3d-symbol-in-2d-view',
                preventDuplicate: true,
            });
            //putting an error log in the console
            console.error('Cannot set 3D symbols while in 2D map view');
        }
    }
    //runs function check every time the active view updates
    useEffect(() => {
        handle3DSymbolErrorIn2DView();
    }, [activeView]);

    useEffect(() => {
        getStratComSymbolSet()
            .then((symbolsSet) => {
                setStratcomSymbols(symbolsSet);
            })
            .catch((error) => {
                console.error(error);
                setStratcomSymbols([]);
            });
    }, []);

    useEffect(() => {
        if (selectedSymbol) {
            setNewSymbol(selectedSymbol.href ?? selectedSymbol.name);
        }
    }, [selectedSymbol]);

    useEffect(() => {
        if (stratcomSymbols) {
            const styleSymbol = stratcomSymbols.find((symbol) => symbol.href === newSymbol);
            if (styleSymbol) {
                onChange({
                    name: styleSymbol.name,
                    href: styleSymbol.href,
                    styleUrl: styleSymbol.styleUrl,
                });
            } else if (newSymbol) {
                // primitive
                onChange({
                    name: newSymbol,
                });
            }
        }
    }, [stratcomSymbols, newSymbol]);

    return (
        <Box>
            <Box>
                {stratcomSymbols && (
                    <InputField
                        variant='outlined'
                        select
                        color='secondary'
                        title={'Point Style'}
                        value={newSymbol}
                        onChange={(event) => {
                            setNewSymbol(event.target.value);
                        }}
                    >
                        {primitiveSymbols.map((symbol) => (
                            <MenuItem key={symbol.name} value={symbol.name}>
                                {symbol.title}
                            </MenuItem>
                        ))}
                        {stratcomSymbols.map((symbol) => {
                            return (
                                <MenuItem key={symbol.name} value={symbol.href} id={symbol.name}>
                                    <StyledSymbolPaper variant='outlined'>
                                        <StyledSymbolImage src={symbol.thumbnailHref} loading={'lazy'} alt={' '} />
                                    </StyledSymbolPaper>
                                    <StyledSymbolText>{symbol.title}</StyledSymbolText>
                                </MenuItem>
                            );
                        })}
                    </InputField>
                )}
            </Box>
        </Box>
    );
};
export default SymbolChooser;
