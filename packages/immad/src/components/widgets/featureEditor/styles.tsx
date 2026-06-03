import styled from 'styled-components';
import Box from '@mui/material/Box/Box';

const StyledEditorWidgetContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;

    .esri-editor {
        height: 100%;
    }

    .esri-editor__header {
        background-color: var(--calcite-ui-foreground-1);
        border-bottom: none;
        box-shadow: 0px 2px 4px -1px rgb(0 0 0 / 20%), 0px 4px 5px 0px rgb(0 0 0 / 14%),
            0px 1px 10px 0px rgb(0 0 0 / 12%);

        .esri-widget__heading {
            color: var(--calcite-ui-text-1);
            font-weight: 400;
            font-size: 1.1rem;
            margin-bottom: 0;
        }

        .esri-editor__back-button {
            &,
            :hover {
                background-color: transparent;
            }
        }
    }

    .esri-editor__content {
        background-color: transparent;

        .esri-editor__feature-list-item {
            background-color: var(--calcite-ui-brand);
            color: var(--calcite-ui-text-inverse);
            border: none;

            :hover {
                background-color: var(--calcite-ui-brand-hover);
            }
            :active {
                background-color: var(--calcite-ui-brand-active);
                color: var(--calcite-ui-text-inverse);
            }
        }
    }

    .esri-editor__controls {
        background-color: var(--calcite-ui-foreground-1);
        border-top: none;
        box-shadow: 0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%),
            0px 1px 3px 0px rgb(0 0 0 / 12%);

        .esri-editor__control-button {
            margin-bottom: 0;

            &:last-child::not(:first-child) {
                margin-top: 5px;
            }
        }
    }
`;

const StyledWarningBox = styled(Box)`
    font-weight: lighter;
    font-style: italic;
    padding: 20px;
`;

export { StyledEditorWidgetContainer, StyledWarningBox };
