import { css } from 'styled-components';

import { theme } from './theme';

const esriDarkTheme = css`
    .calcite-theme-dark {
        --calcite-color-brand: ${theme.palette.secondary.main};
        --calcite-color-brand-hover: ${theme.palette.secondary.main};
        --calcite-color-brand-press: ${theme.palette.secondary.dark};
        --calcite-color-background: ${theme.palette.background.paper};
        --calcite-color-foreground-1: ${theme.palette.primary.dark};
        --calcite-color-foreground-2: ${theme.palette.primary.main};
        --calcite-color-foreground-3: ${theme.palette.secondary.dark};
        --calcite-color-text-1: ${theme.palette.primary.contrastText};
        --calcite-color-text-2: ${theme.palette.primary.contrastText};
        --calcite-color-text-3: ${theme.palette.primary.contrastText};
        --calcite-color-text-inverse: #151515;
        --calcite-color-text-link: #00a0ff;
        --calcite-color-border-1: #4a4a4a;
        --calcite-color-border-2: #404040;
        --calcite-color-border-3: #353535;
        --calcite-color-border-input: #757575;
        --calcite-color-info: #00a0ff;
        --calcite-color-success: #36da43;
        --calcite-color-warning: #ffc900;
        --calcite-color-danger: #fe583e;
        --calcite-color-danger-hover: #ff0015;
        --calcite-color-danger-press: #d90012;
        --calcite-theme-name: 'dark';
        --calcite-color-foreground-current: #214155;
        --calcite-color-inverse: #404040;
        --calcite-color-inverse-hover: #353535;
        --calcite-color-inverse-press: #4a4a4a;
        --calcite-alert-dismiss-progress-background: rgba(43, 43, 43, 0.8);
        --calcite-button-transparent-hover: rgba(255, 255, 255, 0.05);
        --calcite-button-transparent-press: rgba(255, 255, 255, 0.08);
        --calcite-input-message-floating-background: rgba(43, 43, 43, 0.96);
        --calcite-link-blue-underline: rgba(0, 160, 255, 0.4);
        --calcite-scrim-background: rgba(0, 0, 0, 0.75);
        --calcite-app-border-radius-full: 4px;
    }

    .esri-editor {
        overflow-y: auto;
        flex-direction: row;
    }

    .esri-widget {
        background-color: ${theme.palette.background.paper};
        color: ${theme.palette.primary.contrastText};
        font-family: ${theme.typography.fontFamily};
        font-size: ${theme.typography.fontSize};
    }

    .esri-select {
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='-8 -8 32 32' width='32' height='32'%3E%3Cpath d='M8 11.207l-4-4V5.793l4 4 4-4v1.414z' fill='%23adadad' fillrule='nonzero'/%3E%3C/svg%3E")
            no-repeat right center var(--calcite-ui-background);
        border-radius: 4px;

        &:hover {
            border-color: var(--calcite-ui-text-1);
        }

        &.esri-coordinate-conversion__select-row:hover {
            background-color: var(--calcite-ui-foreground-1);
        }
    }
    .esri-coordinate-conversion__display:hover {
        background-color: var(--calcite-ui-foreground-1);
    }

    .esri-layer-list__item-message {
        background-color: ${theme.palette.primary.dark};
        font-size: inherit;
    }

    .esri-grid {
        --lumo-base-color: ${theme.palette.background.paper};
        --lumo-primary-color: ${theme.palette.secondary.main};
        --lumo-contrast-10pct: ${theme.palette.primary.dark};
        --lumo-contrast-20pct: ${theme.palette.primary.light};
        --lumo-contrast-30pct: ${theme.palette.secondary.dark};
        --lumo-row-background-hover: ${theme.palette.primary.main};
        --_lumo-grid-border-color: ${theme.palette.primary.light};
        --_lumo-grid-secondary-border-color: ${theme.palette.primary.dark};
    }

    .esri-input {
        background-color: transparent;
        border-color: var(--calcite-ui-border-1);
        border-radius: var(--calcite-app-border-radius-full);

        :hover {
            border-color: var(--calcite-ui-text-2);
        }

        :focus {
            border-width: 2px;
            border-color: var(--calcite-ui-brand);
            outline: none;
        }

        &[type='text'],
        &[type='password'],
        &[type='number'] {
            height: 40px;
        }
    }

    .esri-feature-form__label {
        color: var(--calcite-ui-text-1);
    }

    .button {
        color: #ff00ff;
        :focus {
            background-color: #00ff00;
        }
    }

    .esri-button {
        background-color: ${theme.palette.secondary.main};
        border-color: ${theme.palette.secondary.main};
        color: ${theme.palette.secondary.contrastText};
        border-radius: var(--calcite-app-border-radius-full);
        text-transform: uppercase;

        :hover {
            background-color: ${theme.palette.secondary.dark};
        }
    }

    .esri-button--tertiary,
    .esri-elevation-profile__header button {
        color: var(--calcite-ui-text-1);
        background-color: var(--calcite-ui-foreground-2);
        border-color: var(--calcite-ui-foreground-2);
    }

    .esri-button-menu__content {
        background: ${theme.palette.primary.main};
    }

    .esri-button-menu__item .esri-button-menu__item-label:hover {
        background-color: ${theme.palette.secondary.dark};
        color: ${theme.palette.secondary.contrastText};
    }

    .esri-button-menu__item .esri-button-menu__item-label {
        color: ${theme.palette.primary.contrastText};
    }

    .esri-widget__heading {
        color: ${theme.palette.common.white};
    }

    .esri-legend {
        padding: calc(var(--esri-widget-padding-v) * 0.5) calc(var(--esri-widget-padding-h) * 0.5);
    }

    .esri-legend__service {
        background-color: ${theme.palette.primary.dark};
        color: ${theme.palette.primary.contrastText};
    }

    .esri-widget--button {
        background-color: ${theme.palette.primary.dark};
        color: ${theme.palette.primary.contrastText};

        &:hover {
            background-color: ${theme.palette.primary.light};
            color: ${theme.palette.primary.contrastText};
        }
    }

    .esri-navigation-toggle {
        background-color: ${theme.palette.background.paper};

        &:hover,
        &:focus {
            background-color: ${theme.palette.background.paper};

            .esri-navigation-toggle__button {
                color: ${theme.palette.common.white};
            }
        }
    }

    .esri-navigation-toggle__button {
        &::before {
            border-color: transparent ${theme.palette.common.white} transparent transparent;
        }
    }

    .esri-navigation-toggle__button--active {
        background-color: ${theme.palette.background.default};
        color: ${theme.palette.primary.contrastText};
    }

    .esri-layer-list__item {
        background-color: ${theme.palette.primary.dark};
    }

    .esri-layer-list__item.esri-layer-list--chosen {
        background-color: ${theme.palette.primary.main};
    }

    .esri-layer-list__item-toggle {
        color: ${theme.palette.common.white};
    }

    .esri-layer-list__item-actions-menu-item {
        color: ${theme.palette.common.white};

        &:hover {
            background-color: ${theme.palette.secondary.main};
            color: ${theme.palette.secondary.contrastText};
        }
    }

    .esri-layer-list__item-actions-menu-item--active {
        background-color: ${theme.palette.secondary.main};
        color: ${theme.palette.secondary.contrastText};

        &:hover {
            background-color: ${theme.palette.secondary.main};
            color: ${theme.palette.secondary.contrastText};
        }
    }

    .esri-layer-list__item-actions-list {
        background-color: ${theme.palette.primary.main};
        border-top-color: ${theme.palette.primary.light};
    }

    .esri-layer-list__item-actions {
        background-color: transparent;
        color: ${theme.palette.common.white};
    }

    .esri-layer-list__item-action {
        &:hover {
            background-color: ${theme.palette.secondary.main};
            color: ${theme.palette.secondary.contrastText};
        }
    }

    .esri-layer-list__action-toggle {
        &:hover {
            background-color: ${theme.palette.secondary.main};
            color: ${theme.palette.secondary.contrastText};
        }
    }

    .esri-basemap-gallery__item-title {
        color: ${theme.palette.primary.contrastText};
    }

    .esri-basemap-gallery__item {
        &:hover,
        &:focus {
            background-color: ${theme.palette.secondary.main};

            .esri-basemap-gallery__item-title {
                color: ${theme.palette.secondary.contrastText};
            }
        }
    }
`;

export default esriDarkTheme;
