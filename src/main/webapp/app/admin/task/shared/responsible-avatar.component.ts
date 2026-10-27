import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

import {initialsOf, responsibleColor} from './task-urgency.utils';

/**
 * Pastille d'initiales du responsable d'une sous-tâche.
 *
 * Trois états : responsable propre (fond plein), responsable hérité de la tâche
 * (contour plein) et absence de responsable (contour pointillé et « ? »).
 */
@Component({
               selector: 'responsible-avatar',
               template: `
                   <span [class.ra--inherited]="variant() === 'inherited'"
                         [class.ra--none]="variant() === 'none'"
                         [style.--ra-color]="color()"
                         [title]="hint()"
                         class="ra">{{ initials() }}</span>`,
               styles: [`
                   :host {
                       display: inline-flex;
                   }

                   .ra {
                       display: inline-flex;
                       align-items: center;
                       justify-content: center;
                       width: 20px;
                       height: 20px;
                       border-radius: 50%;
                       background: var(--ra-color);
                       color: var(--app-surface);
                       font-size: 10px;
                       font-weight: 700;
                       line-height: 1;
                       letter-spacing: .02em;
                       user-select: none;
                   }

                   .ra--inherited {
                       background: transparent;
                       border: 1.5px solid var(--ra-color);
                       color: var(--ra-color);
                   }

                   .ra--none {
                       background: transparent;
                       border: 1.5px dashed var(--app-warning);
                       color: var(--app-warning);
                   }
               `],
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class ResponsibleAvatarComponent {
    /** Responsable propre à la sous-tâche. */
    readonly responsible = input<string | null>(null);
    /** Responsable de la tâche parente, utilisé en repli. */
    readonly taskResponsible = input<string | null>(null);
    /** Liste triée des responsables du salon, qui fixe la couleur de chacun. */
    readonly known = input<string[]>([]);

    private readonly translateService = inject(TranslateService);

    readonly owner = computed(() => this.responsible() ?? this.taskResponsible() ?? null);

    readonly variant = computed<'own' | 'inherited' | 'none'>(() => {
        if (this.responsible()) {
            return 'own';
        }

        return this.taskResponsible() ? 'inherited' : 'none';
    });

    readonly initials = computed(() => this.variant() === 'none' ? '?' : initialsOf(this.owner()));

    readonly color = computed(() => responsibleColor(this.owner(), this.known()));

    readonly hint = computed(() => {
        if (this.variant() === 'none') {
            return this.translateService.instant('task.group.noResponsible') as string;
        }

        const name = this.owner() ?? '';

        return this.variant() === 'inherited'
               ? `${name} · ${this.translateService.instant('task.list.viaTask') as string}`
               : name;
    });
}
