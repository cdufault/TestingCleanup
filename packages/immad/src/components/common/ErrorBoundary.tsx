import React, { ReactNode } from 'react';
import { Alert } from '@mui/lab';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Use console.error here instead of LogInfo, to get stack trace
        console.error('Uncaught error: ', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Alert variant={'outlined'} severity={'error'}>
                    There was an error. Please reload the component.
                </Alert>
            );
        }

        return this.props.children;
    }
}
