import {RequiredField} from './required-field';

export interface AvailableAction {
    contextCode: string;
    type: string;
    disabled: boolean;
    labelKey: string;
    helpKey?: string;
    confirmationKey?: string;
    requiredFields: RequiredField[];
    disabledReasonKey?: string;
}
