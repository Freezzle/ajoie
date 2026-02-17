import {RequiredField} from './required-field';

export interface AvailableAction {
    contextCode: string;
    type: string;
    disabled: boolean;
    labelKey: string;
    needsConfirmation: boolean;
    requiredFields: RequiredField[];
}
