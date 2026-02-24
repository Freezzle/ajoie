import {RequiredField} from './required-field';
import {ConditionalKey} from './conditional-key';

export interface AvailableAction {
    contextCode: string;
    type: string;
    disabled: boolean;
    labelKey: string;
    helpKey?: string;
    confirmationKey?: string;
    requiredFields: RequiredField[];
    conditionalKeys: ConditionalKey[];
}
