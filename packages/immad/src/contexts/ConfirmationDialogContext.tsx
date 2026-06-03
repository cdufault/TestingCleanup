import React, { useContext, useRef, useState } from 'react';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';

interface ConfirmationDialogProviderProps {
    children: JSX.Element[] | JSX.Element;
}

interface ConfirmationDialogContextProps {
    description: string;
    title: string;
    handleClose: () => void;
    handleSubmit: () => void;
    setDescription: (value: string) => void;
    setTitle: (value: string) => void;
    showConfirmationDialog: () => any;
}

const ConfirmationDialogContext = React.createContext<ConfirmationDialogContextProps>({
    description: '',
    title: '',
    handleClose: () => {
        return;
    },
    handleSubmit: () => {
        return;
    },
    setDescription: (_value: string) => {
        return;
    },
    setTitle: (_value: string) => {
        return;
    },
    showConfirmationDialog: (): any => {
        return;
    },
});

const useConfirmationDialogContext = (): ConfirmationDialogContextProps => {
    return useContext(ConfirmationDialogContext);
};

const ConfirmationDialogProvider = ({ children }: ConfirmationDialogProviderProps): JSX.Element => {
    const [showModal, setShowModal] = useState(false);
    const resolver = useRef<(value: boolean | PromiseLike<boolean>) => void>();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const handleShow = (): Promise<boolean> => {
        setShowModal(true);

        return new Promise((resolve) => {
            resolver.current = resolve;
        });
    };

    const handleSubmit = () => {
        resolver.current && resolver.current(true);
        setShowModal(false);
    };

    const handleClose = () => {
        resolver.current && resolver.current(false);
        setShowModal(false);
    };

    const value = {
        description,
        title,
        handleClose,
        handleSubmit,
        setDescription,
        setTitle,
        showConfirmationDialog: handleShow,
    };

    return (
        <ConfirmationDialogContext.Provider value={value}>
            {children}

            <ConfirmationDialog
                open={showModal}
                title={title}
                description={description}
                onSubmit={handleSubmit}
                onClose={handleClose}
            />
        </ConfirmationDialogContext.Provider>
    );
};

export { ConfirmationDialogProvider, useConfirmationDialogContext };
