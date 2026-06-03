import { RMTCodeTypeQueryMetadata, RMTQueryMetadata } from '../administrator/components/AdminSettingsSlice';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { MissionLogInfo, NewtHeader, NewtMessage } from './MissionLogSlice';
import { convertJulian } from './MissionLogHelper';

/**
 * This class enables the tracking of datasouce errors
 */
class MissionLogDataSourceError {
    static errorMessages: string[];
    /**
     * Add the error message to the collection
     * @param errorMessage the error message
     */
    static addToMissionLogErrors(errorMessage: string) {
        if (!this.errorMessages) {
            this.errorMessages = [];
        }
        this.errorMessages.push(errorMessage);
    }

    /**
     * Remove all the error messages
     */
    static clearMissionLogErrors() {
        if (this.errorMessages) {
            this.errorMessages = [];
        }
    }

    /**
     * Return all the error messages
     */
    static getMissionLogErrors(): string[] {
        if (this.errorMessages) {
            return [...this.errorMessages];
        }
        return [];
    }
}

/**
 * Parse the mission message header
 * @param headerSection
 */
const parseHeader = (headerSection: string[]): NewtHeader => {
    const metadata =
        headerSection[2].toString() + '/' + headerSection[3].toString() + '/' + headerSection[4].toString();
    const totalQuantity = headerSection[6];
    const julianDate = convertJulian(headerSection[5]);

    return {
        type: headerSection[0].toString(),
        category: headerSection[1].toString(),
        metadata: metadata,
        timeStamp: julianDate ? julianDate : 'Incorrect Date Format',
        totalQuantity: Number(totalQuantity),
    };
};

/**
 * Parse the message codes
 * @param type
 * @param codes
 * @param rmtData
 */
const parseCodes = async (type: string, codes: string[], rmtData: RMTQueryMetadata[]) => {
    //Get possible message codes
    const possibleMessageCodes = await getPossibleMessageCodes(type, rmtData);
    const message: {
        [key: string]: NewtMessage[];
    } = {};
    for (const newtCode of possibleMessageCodes) {
        if (newtCode && newtCode.code) message[newtCode.code] = [];
    }
    let order = 0;
    for (const code of codes) {
        let origin: string | number = code.split('-')[0];
        const count: string = code.split('-')[1];
        if (!isNaN(Number(origin))) {
            origin = Number.parseInt(origin);
        }
        for (const messageCode of possibleMessageCodes) {
            if (messageCode.values.includes(origin)) {
                const newtMessage: NewtMessage = {
                    order: order,
                    origin: origin,
                    value: '',
                    count: Number.parseInt(count),
                    codeAlias: messageCode.codeAlias,
                };
                message[messageCode.code].push(newtMessage);
                order++;
            }
        }
    }
    return message;
};

/**
 * Get all possible message code values -  this is used to determine what code type each message is.
 * @param type
 * @param rmtData
 */
const getPossibleMessageCodes = async (type: string, rmtData: RMTQueryMetadata[]) => {
    const possibleMessageCodes = [];
    for (const rmtDataItem of rmtData) {
        if (rmtDataItem.rmtMessageType.toUpperCase() === type) {
            for (const codeType of rmtDataItem.codeTypes) {
                const codeValues = await getCodeTypeValues(codeType);
                if (codeValues) possibleMessageCodes.push(codeValues);
            }
        }
    }
    return possibleMessageCodes;
};

/**
 * Returns the possible values for each code type.
 * @param codeType
 */
const getCodeTypeValues = async (codeType: RMTCodeTypeQueryMetadata) => {
    if (codeType.portalItemId) {
        const featureLayer = new FeatureLayer({
            portalItem: {
                id: codeType.portalItemId,
            },
        });
        await featureLayer.load();
        const query = featureLayer.createQuery();
        query.outFields = [codeType.queryFields[0].selectedFieldObj.name, featureLayer.objectIdField];
        query.where = '1=1';
        query.returnGeometry = false;
        query.returnDistinctValues = true;
        const results = await featureLayer.queryFeatures(query);
        const values = [];
        for (const feature of results.features) {
            const value = feature.attributes[codeType.queryFields[0].selectedFieldObj.name];
            if (value) {
                if (codeType.queryFields[0].selectedFieldObj.fieldType === 'number') {
                    values.push(value);
                } else {
                    values.push(value.toString().toUpperCase());
                }
            } else {
                const oidField = featureLayer.objectIdField;
                const oidValue = feature.attributes[oidField];
                const queryField = codeType.queryFields[0].selectedFieldObj.alias;
                const error = `OID: ${oidValue}  | Layer: ${featureLayer.title}  | Attribute: ${queryField} was empty.`;
                MissionLogDataSourceError.addToMissionLogErrors(error);
            }
        }
        return { code: codeType.newtCode, codeAlias: codeType.codeAlias, values: values };
    } else {
        MissionLogDataSourceError.addToMissionLogErrors(
            'Mission Log not properly configured, please contact an Administrator.'
        );
        return;
    }
};

/**
 * Parse the mission message.
 * @param missionLogText
 * @param rmtData
 */
export const parseMessage = async (
    missionLogText: string,
    rmtData: RMTQueryMetadata[]
): Promise<MissionLogInfo | undefined> => {
    MissionLogDataSourceError.clearMissionLogErrors();
    const messageSections = missionLogText?.split('\n');
    if (messageSections?.length) {
        const headerSection = messageSections[0].split('/');
        let header: NewtHeader;
        if (headerSection.length === 7) {
            header = parseHeader(headerSection);
        } else {
            return { messages: [], dataSourceErrors: ['Header section not formatted correctly'] };
        }
        const codeSections = messageSections.slice(1, messageSections.length - 1);
        const codes = [];
        for (const section of codeSections) {
            if (section !== 'END') {
                const codeSplit = section.split('/');
                for (const code of codeSplit) {
                    if (code && code !== '&') {
                        codes.push(code);
                    }
                }
            }
        }
        if (header && codes) {
            const parsedCodes = await parseCodes(header.type, codes, rmtData);
            const data = {
                header: header,
                message: parsedCodes,
            };
            const errors = MissionLogDataSourceError.getMissionLogErrors();
            MissionLogDataSourceError.clearMissionLogErrors();
            return { messages: [data], dataSourceErrors: errors };
        } else {
            return { messages: [], dataSourceErrors: MissionLogDataSourceError.getMissionLogErrors() };
        }
    } else {
        return { messages: [], dataSourceErrors: ['Message Not Formatted Correctly'] };
    }
};
