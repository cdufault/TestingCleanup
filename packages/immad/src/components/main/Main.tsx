// React imports
import React, {useEffect} from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

// Context and style imports
import { SaveLoadProvider } from '../../contexts/SaveLoad';
import CssBaseline from '@mui/material/CssBaseline';
import { GlobalStyle } from '../../styles/global';
import { theme } from '../../styles/theme';
import { StylesProvider } from '@mui/styles';
import { ThemeProvider } from '@mui/material/styles';

// Component imports
import Home from '../home';
import Workspace from '../workspace';
import Administrator from '../administrator';
import RefreshListener from './RefeshListener';
import {getWebGL3DSupportInfo, WebGL3DSupportInfo} from "@stratcom/lib-functions";
import {setIs2dOnlyActive, setWebGlErrorMessage} from "../webMap/WebMapViewSlice";
import {useAppDispatch, useAppSelector} from "../../hooks/hooks";

const Main = (): JSX.Element => {

    const dispatch = useAppDispatch();
    const is2dOnlyActive = useAppSelector((state) => state.webMapViewSlice.is2dOnlyActive);

    if(is2dOnlyActive === undefined) {
        console.debug("Checking WebGL support...");
        const webglSupport: WebGL3DSupportInfo = getWebGL3DSupportInfo();
        dispatch(setIs2dOnlyActive(!webglSupport.isWebGLSupported));
        dispatch(setWebGlErrorMessage(webglSupport.resultMessage));
    }

    console.debug('BASENAME value: ' + process.env.BASENAME);
    return (
        <SaveLoadProvider>
            <ThemeProvider theme={theme}>
                <StylesProvider>
                    <GlobalStyle />
                    <CssBaseline />
                    <BrowserRouter basename={process.env.BASENAME || ''}>
                        {/* This component listens for route changes */}
                        <RefreshListener />
                        <Switch>
                            <Route exact path='/' component={Home} />
                            <Route path='/workspace' component={Workspace} />
                            <Route path='/administrator' component={Administrator} />
                        </Switch>
                    </BrowserRouter>
                </StylesProvider>
            </ThemeProvider>
        </SaveLoadProvider>
    );
};

export default Main;
