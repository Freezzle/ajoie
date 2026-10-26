import {RequiredField} from './required-field';
import {ConditionalKey} from './conditional-key';

/** Ce que l'écran doit relire après l'action : l'entité seule, la liste, ou rien. */
export type RefreshScope = 'ENTITY' | 'LIST' | 'NONE';

export interface AvailableAction {
    contextCode: string;
    type: string;
    disabled: boolean;
    labelKey: string;
    helpKey?: string;
    confirmationKey?: string;
    requiredFields: RequiredField[];
    conditionalKeys: ConditionalKey[];
    refreshScope?: RefreshScope;
}

/** Portée d'une action, avec le repli le plus sûr quand le serveur ne la précise pas. */
export function refreshScopeOf(action: AvailableAction): RefreshScope {
    return action.refreshScope ?? 'ENTITY';
}
