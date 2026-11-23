import {Directive, input, TemplateRef} from '@angular/core';

import {Notif} from '../notif-badge/notif.model';

export interface AppTab {
    key: string;
    /** Clé i18n du libellé. */
    labelKey?: string;
    /** Libellé brut (noms dynamiques : jours, noms de plan…). Prioritaire sur labelKey. */
    label?: string;
    /** 'pi pi-star' */
    icon?: string;
    badge?: Notif | null;
    disabled?: boolean;
    /** Retiré du rendu (droits, etc.). */
    hidden?: boolean;
}

/** Contenu d'un onglet, rendu uniquement quand l'onglet est actif. */
@Directive({selector: 'ng-template[appTabPanel]', standalone: true})
export class TabPanelDirective {
    readonly key = input.required<string>({alias: 'appTabPanel'});

    constructor(public readonly tpl: TemplateRef<unknown>) {
    }
}

/**
 * Corps encadré générique, rendu sous la barre d'onglets.
 * À utiliser quand les onglets sont dynamiques (jours, plans…) et que le contenu
 * ne dépend pas d'un template par onglet : le consommateur projette un seul corps.
 */
@Directive({selector: '[appTabsBody]', standalone: true})
export class TabBodyDirective {
}
