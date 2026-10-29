import {Component, EventEmitter, Input, Output} from '@angular/core';

import SharedModule from '../../shared.module';

export type StepState = 'cur' | 'done' | 'warn' | 'todo';

export interface StepDescriptor {
    key: string;
    shortLabelKey: string;
    labelKey: string;
}

/**
 * Barre segmentée collante du stepper d'inscription.
 * Les états sont fournis par le conteneur (calculés, jamais stockés).
 */
@Component({
               selector: 'app-step-progress',
               imports: [SharedModule],
               templateUrl: './step-progress.component.html',
               styleUrl: './step-progress.component.scss'
           })
export class StepProgressComponent {
    @Input() steps: StepDescriptor[] = [];
    @Input() states: StepState[] = [];
    @Input() current: number = 0;
    @Input() progress: number = 0;

    @Output() stepClick = new EventEmitter<number>();

    railWidth(index: number): number {
        const state = this.states[index];
        if (state === 'done' || state === 'warn') {
            return 100;
        }
        if (state === 'cur') {
            return Math.max(8, Math.min(100, this.progress));
        }
        return 0;
    }

    stateKey(index: number): string {
        switch (this.states[index]) {
            case 'done':
                return 'registration.step.state.done';
            case 'warn':
                return 'registration.step.state.warn';
            case 'cur':
                return 'registration.step.state.current';
            default:
                return 'registration.step.state.todo';
        }
    }

    onClick(index: number): void {
        this.stepClick.emit(index);
    }
}
