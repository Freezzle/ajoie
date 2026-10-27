import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

import {ISubtaskInstance} from '../model/task-instance.interface';
import {TimeSincePipe} from '../../../shared/pipe/time-since.pipe';
import {
    daysLeft,
    daysUntil,
    effectiveDue,
    formatShortDate,
    isActive,
    isMoved,
    urgency,
    urgencyColor
} from './task-urgency.utils';

/**
 * Délai d'une sous-tâche exprimé en jours relatifs à aujourd'hui.
 *
 * Quand la limite a été repoussée, l'ancien et le nouveau délai tiennent sur une
 * seule ligne, seuls les jours sont barrés et le mot « dans » n'apparaît qu'une fois.
 * La date exacte n'est visible qu'au survol.
 */
@Component({
               selector: 'due-label',
               imports: [],
               template: `
                   <span [style.color]="color()" [title]="hint()" class="dl">
                       @if (parts(); as part) {
                           @if (part.prefix) {
                               <span class="dl-nowrap">{{ part.prefix }}</span>
                           }
                           <s class="dl-nowrap">{{ part.old }}</s>
                           <span class="dl-nowrap">{{ part.current }}</span>
                       } @else {
                           <span class="dl-nowrap">{{ label() }}</span>
                       }
                   </span>`,
               styles: [`
                   :host {
                       display: inline-block;
                       font-size: var(--app-fs-sm);
                   }

                   .dl {
                       display: inline-flex;
                       flex-wrap: wrap;
                       justify-content: flex-end;
                       gap: 0 4px;
                       font-weight: 500;
                   }

                   .dl-nowrap {
                       white-space: nowrap;
                   }

                   s {
                       color: var(--app-text-muted);
                       font-weight: 400;
                   }
               `],
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class DueLabelComponent {
    readonly subtask = input.required<ISubtaskInstance>();

    private readonly translateService = inject(TranslateService);
    private readonly timeSince = new TimeSincePipe();

    readonly color = computed(() => isActive(this.subtask())
                                    ? urgencyColor(urgency(this.subtask()))
                                    : 'var(--app-text-muted)');

    /** Libellé simple, utilisé tant que la limite n'a pas été repoussée. */
    readonly label = computed(() => {
        const subtask = this.subtask();

        if (!isActive(subtask)) {
            return subtask.completedAt
                   ? this.text('task.due.done', {since: this.timeSince.transform(subtask.completedAt)})
                   : this.text('task.status.DONE');
        }

        return this.relative(daysLeft(subtask));
    });

    /**
     * Décomposition « ancien délai barré / nouveau délai » ; `null` quand la limite
     * n'a pas été repoussée.
     */
    readonly parts = computed<{prefix: string; old: string; current: string} | null>(() => {
        const subtask = this.subtask();
        if (!isMoved(subtask)) {
            return null;
        }

        const before = daysUntil(subtask.dueDate);
        const after = daysUntil(subtask.snoozedUntil);

        if (before === null || after === null) {
            return null;
        }

        // Les deux délais sont dans le futur : « dans » n'est écrit qu'une fois.
        if (before > 1 && after > 1) {
            return {
                prefix: this.text('task.due.inPrefix'),
                old: this.text('task.due.days', {n: before}),
                current: this.text('task.due.days', {n: after})
            };
        }

        // Les deux délais sont en retard : « de retard » n'est écrit qu'une fois.
        if (before < -1 && after < -1) {
            return {
                prefix: '',
                old: this.text('task.due.days', {n: -before}),
                current: `${this.text('task.due.days', {n: -after})} ${this.text('task.due.lateSuffix')}`
            };
        }

        return {prefix: '', old: this.relative(before), current: this.relative(after)};
    });

    readonly hint = computed(() => {
        const subtask = this.subtask();

        if (!isMoved(subtask)) {
            return formatShortDate(effectiveDue(subtask));
        }

        const shift = (daysUntil(subtask.snoozedUntil) ?? 0) - (daysUntil(subtask.dueDate) ?? 0);

        return this.text('task.due.movedTitle', {
            n: shift,
            from: formatShortDate(subtask.dueDate),
            to: formatShortDate(subtask.snoozedUntil)
        });
    });

    /** Libellé complet d'un nombre de jours restants. */
    private relative(days: number | null): string {
        if (days === null) {
            return this.text('task.due.none');
        }
        if (days < -1) {
            return this.text('task.due.late', {n: -days});
        }
        if (days === -1) {
            return this.text('task.due.yesterday');
        }
        if (days === 0) {
            return this.text('task.due.today');
        }
        if (days === 1) {
            return this.text('task.due.tomorrow');
        }

        return this.text('task.due.in', {n: days});
    }

    private text(key: string, params?: object): string {
        return this.translateService.instant(key, params) as string;
    }
}
