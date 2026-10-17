import {Component, EventEmitter, Input, Output} from '@angular/core';

import SharedModule from '../../../../shared/shared.module';

/**
 * Carte-question réutilisable : icône, question, prix éventuel, boutons Oui / Non et contenu projeté.
 */
@Component({
               selector: 'app-service-question-card',
               imports: [SharedModule],
               templateUrl: './service-question-card.component.html',
               styleUrl: './service-question-card.component.scss'
           })
export class ServiceQuestionCardComponent {
    @Input({required: true}) questionKey!: string;
    @Input({required: true}) name!: string;
    @Input() icon: string = 'pi-box';
    @Input() priceHint: string | null = null;
    @Input() answer: boolean | null = null;
    @Input() showError: boolean = false;

    @Output() answerChange = new EventEmitter<boolean>();

    select(value: boolean): void {
        this.answerChange.emit(value);
    }
}
