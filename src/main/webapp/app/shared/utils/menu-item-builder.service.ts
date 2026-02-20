import {inject, Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {PrimeIcons} from 'primeng/api';
import {AvailableAction} from '../model/available-action';
import {AppMenuItem} from './app-menu-item.model';

@Injectable({
    providedIn: 'root'
})
export class MenuItemBuilderService {
    private readonly translateService = inject(TranslateService);

    /**
     * Construit les items de menu à partir des actions disponibles
     * @param availableActions Liste des actions disponibles
     * @param commandCallback Fonction callback pour gérer la commande (action, event)
     * @param disabledCallback Fonction optionnelle pour déterminer si l'item doit être désactivé (action)
     * @returns Liste des items de menu
     */
    buildMenuItemsFromActions(
        availableActions: AvailableAction[],
        commandCallback: (action: AvailableAction, event: HTMLElement) => void,
        disabledCallback?: (action: AvailableAction) => boolean
    ): AppMenuItem[] {
        const items: AppMenuItem[] = [];

        for (const action of availableActions ?? []) {
            const helpText = action.helpKey ? this.translateService.instant(action.helpKey) as string : undefined;

            const isDisabled = disabledCallback ?
                (action.disabled || disabledCallback(action)) :
                action.disabled;

            items.push({
                label: this.translateService.instant(action.labelKey) as string,
                disabled: isDisabled,
                command: (event) => commandCallback(action, event.originalEvent?.target as HTMLElement),
                data: {type: action.type},
                icon: this.getIconForActionType(action.type),
                helpText: helpText
            });
        }
        return items;
    }

    /**
     * Retourne l'icône PrimeNG appropriée selon le type d'action
     * @param actionType Type d'action (EMAIL, DOWNLOAD, BUSINESS)
     * @returns Icône PrimeNG ou undefined
     */
    private getIconForActionType(actionType: string): string | undefined {
        switch (actionType) {
            case 'EMAIL':
                return PrimeIcons.ENVELOPE;
            case 'DOWNLOAD':
                return PrimeIcons.FILE_PDF;
            case 'BUSINESS':
                return PrimeIcons.BOLT;
            default:
                return undefined;
        }
    }
}
