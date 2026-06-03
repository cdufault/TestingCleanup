import { ICellRendererComp, ICellRendererParams } from 'ag-grid-community';
import { ConfigHelper } from '../../../helpers/configHelper';
import { getMissionStratleadExpirations } from '../../../helpers/missionHelper';
import { StratLeadExpiration } from '../interfaces/StratLead';

export class supportMissionId {
    static missionId = '';
    static missionExpiratons = [];

    static async setMissionId(missionId: string) {
        if (missionId !== 'error' && missionId !== '') {
            const expirations = await getMissionStratleadExpirations(missionId);
            this.missionId = missionId;
            if (expirations) {
                this.missionExpiratons = expirations;
            }
        } else {
            this.missionId = 'error';
        }
    }
    static getMissionId() {
        return this.missionId;
    }
    static getMissionExpirations() {
        return this.missionExpiratons;
    }
}

export class StratLeadExpirationRenderer implements ICellRendererComp {
    appConfig = ConfigHelper.getAppConfig();
    eGui!: HTMLSpanElement;

    init(params: ICellRendererParams): void {
        // NOTE: because this is a TS file, we cannot use a typical separate styles tsx file
        // these styles will never be used outside of this renderer
        this.eGui = document.createElement('div');
        this.eGui.style.display = 'flex';
        this.eGui.style.flex = '1 1';
        this.eGui.style.flexWrap = 'nowrap';
        this.eGui.style.height = 'inherit';

        const numDiv = document.createElement('div');
        numDiv.style.display = 'flex';
        numDiv.style.border = '3px solid #000';
        numDiv.style.color = '#FFF';
        numDiv.style.alignItems = 'center';
        numDiv.style.justifyContent = 'center';
        numDiv.style.margin = '5px 5px 5px 0';
        numDiv.style.padding = '5px';

        const dateDiv = document.createElement('div');
        dateDiv.style.display = 'block';
        dateDiv.style.margin = 'auto';
        dateDiv.style.overflow = 'hidden';
        dateDiv.style.textOverflow = 'ellipsis';
        dateDiv.style.whiteSpace = 'nowrap';

        const defaultStratLeadExpiration = { id: '', label: '', expirationTime: -1, color: '#a9a9a9' };

        if (params.value) {
            const currentDate = new Date(new Date().toISOString()).getTime();
            const lastEdited = new Date(new Date(params.value).toISOString()).getTime();
            const difference = Math.floor((currentDate - lastEdited) / 3600000); //convert milliseconds to hours

            const stratLeadExpirations = supportMissionId.getMissionExpirations() as StratLeadExpiration[];

            if (stratLeadExpirations) {
                const low = stratLeadExpirations.find((item) => item.id === 'low');
                const medium = stratLeadExpirations.find((item) => item.id === 'medium');
                const high = stratLeadExpirations.find((item) => item.id === 'high');

                if (low && difference <= low.expirationTime) {
                    numDiv.style.backgroundColor = low.color;
                } else if (low && medium && difference > low.expirationTime && difference <= medium.expirationTime) {
                    numDiv.style.backgroundColor = medium.color;
                } else if (medium && high && difference > medium.expirationTime && difference <= high.expirationTime) {
                    numDiv.style.backgroundColor = high.color;
                } else {
                    numDiv.style.backgroundColor = defaultStratLeadExpiration.color;
                }

                numDiv.innerHTML = difference.toString();
                numDiv.title = `${difference} ${this.appConfig.tacticalGrid.stratLeadExpirationUnitLabel} since creation`;

                this.eGui.appendChild(numDiv);

                dateDiv.innerHTML = new Date(params.value).toLocaleString();
                dateDiv.title = new Date(params.value).toLocaleString();
                this.eGui.appendChild(dateDiv);
            } else {
                this.eGui.innerHTML = '';
            }
        } else {
            this.eGui.innerHTML = '';
        }
    }

    getGui(): HTMLSpanElement {
        return this.eGui;
    }

    refresh(): boolean {
        return false;
    }
}
