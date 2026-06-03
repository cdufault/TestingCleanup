import React, { useContext, useState } from 'react';
import { analystLayout } from '../components/analyst/resources';
import FlexLayout, { Model } from 'flexlayout-react';

interface LayoutProviderProps {
    children: JSX.Element[] | JSX.Element;
}

interface LayoutContextProps {
    model: Model;
    showModal: boolean;
    setModel: (value: Model) => void;
    setShowModal: (value: boolean) => void;
}

const LayoutContext = React.createContext<LayoutContextProps>({
    model: FlexLayout.Model.fromJson(analystLayout),
    showModal: false,
    setModel: (_value: Model) => {
        return;
    },
    setShowModal: (_value: boolean) => {
        return;
    },
});

const useLayoutContext = (): LayoutContextProps => {
    return useContext(LayoutContext);
};

const LayoutProvider = ({ children }: LayoutProviderProps): JSX.Element => {
    //start with the default layout, if the user has saved state it will be applied in the Layout.tsx module
    const [model, setModel] = useState<Model>(FlexLayout.Model.fromJson(analystLayout));

    const [showModal, setShowModal] = useState<boolean>(false);

    /* 
    The ...Model.fromJson call returns a new model. If tabs are popped out this model change appears to create an
    issue when the Show Window link is clicked.See Layout.tsx handleModelChanged. Keeping this reference for now in
    case any side effects are found as a result of this update.
    useEffect(() => {
        if (modelJson !== '') {
            setModel(FlexLayout.Model.fromJson(JSON.parse(modelJson)));
        }
    }, [modelJson]); */

    const value = {
        model,
        showModal,
        setModel,
        setShowModal,
    };

    return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};

export { LayoutContext, LayoutProvider, useLayoutContext };
