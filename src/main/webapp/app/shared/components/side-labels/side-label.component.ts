import {ChangeDetectionStrategy, Component, input, TemplateRef, viewChild} from '@angular/core';

import {Notif} from '../notif-badge/notif.model';

export type SideLabelHintType = 'warning' | 'danger' | 'info';

@Component({
               selector: 'app-side-label',
               standalone: true,
               template: '<ng-template #content><ng-content/></ng-template>',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class SideLabelComponent {
    readonly key = input.required<string>();
    readonly labelKey = input.required<string>();
    /** 'pi pi-user' */
    readonly icon = input.required<string>();
    readonly badge = input<Notif | null>(null);
    /** Motif d'alerte (info-bulle + bandeau du panneau). */
    readonly hintKey = input<string | null>(null);
    readonly hintType = input<SideLabelHintType>('warning');
    /** Sous-texte de l'info-bulle quand il n'y a pas d'alerte. */
    readonly summary = input<string | null>(null);

    readonly content = viewChild.required<TemplateRef<unknown>>('content');
}
