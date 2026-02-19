import {RequiredField} from './required-field';

export interface AvailableAction {
    contextCode: string;
    type: string;
    disabled: boolean;
    labelKey: string;
    helpKey?: string; // Clé de traduction pour le texte d'aide contextuelle
    needsConfirmation: boolean;
    requiredFields: RequiredField[];
}
