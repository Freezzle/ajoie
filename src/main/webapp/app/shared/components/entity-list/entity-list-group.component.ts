import {ChangeDetectionStrategy, Component, input, model} from '@angular/core';

import SharedModule from '../../shared.module';

/**
 * En-tête de groupe collant et repliable, avec son effectif, un résumé projeté
 * (`[groupSummary]`) et une barre de proportion. Les lignes sont projetées par défaut.
 */
@Component({
               selector: 'entity-list-group',
               imports: [SharedModule],
               templateUrl: './entity-list-group.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class EntityListGroupComponent {
    /** Clé de traduction du libellé, ou libellé brut si `rawLabel` est vrai. */
    readonly label = input.required<string>();
    readonly rawLabel = input<boolean>(false);
    readonly color = input<string>('var(--app-primary)');
    readonly count = input<number>(0);
    /** Part du groupe dans le total, de 0 à 1. */
    readonly ratio = input<number>(0);
    readonly collapsed = model<boolean>(false);

    toggle(): void {
        this.collapsed.set(!this.collapsed());
    }

    get percent(): number {
        return Math.round(Math.min(1, Math.max(0, this.ratio())) * 100);
    }
}
