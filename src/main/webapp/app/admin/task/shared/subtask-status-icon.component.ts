import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';

import {TaskStatus} from '../model/task-instance.interface';
import {statusColorOf} from './task-urgency.utils';

/** Clé de forme de la pastille : un statut de sous-tâche. */
export type StatusIconKey = TaskStatus;

/**
 * Pastille de statut d'une sous-tâche : seul indicateur de statut d'une ligne.
 * La forme porte l'information, de sorte qu'elle reste lisible sans la couleur.
 * Réutilisée dans les lignes, les puces de filtre, les résumés de groupe et le panneau.
 */
@Component({
               selector: 'subtask-status-icon',
               template: `
                   <svg [style.color]="color()" aria-hidden="true" viewBox="0 0 20 20">
                       @switch (statusKey()) {
                           @case ('BLOCKED') {
                               <circle cx="10" cy="10" fill="currentColor" r="8.5"/>
                               <rect fill="var(--app-surface)" height="2.4" rx="1" width="9" x="5.5" y="8.8"/>
                           }
                           @case ('DONE') {
                               <circle cx="10" cy="10" fill="currentColor" r="8.5"/>
                               <path d="M6.3 10.3l2.5 2.5 4.9-5.2"
                                     fill="none"
                                     stroke="var(--app-surface)"
                                     stroke-linecap="round"
                                     stroke-linejoin="round"
                                     stroke-width="2.2"/>
                           }
                           @default {
                               <circle cx="10" cy="10" fill="none" r="7.5" stroke="currentColor" stroke-width="2"/>

                               @if (statusKey() === 'IN_PROGRESS') {
                                   <path d="M10 4.5a5.5 5.5 0 0 1 0 11z" fill="currentColor"/>
                               }
                           }
                       }
                   </svg>`,
               styles: [`
                   :host {
                       display: inline-flex;
                       align-items: center;
                       justify-content: center;
                   }

                   svg {
                       display: block;
                       width: var(--sti-size, 20px);
                       height: var(--sti-size, 20px);
                   }
               `],
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class SubtaskStatusIconComponent {
    readonly statusKey = input.required<StatusIconKey>();

    readonly color = computed(() => statusColorOf(this.statusKey()));
}
