import {ChangeDetectionStrategy, Component, input} from '@angular/core';

export type StepTimelineState = 'done' | 'current' | 'todo' | 'error';

export interface StepTimelineStep {
    key: string;
    label: string;
    sublabel?: string;
    state: StepTimelineState;
    date?: unknown;
    segment?: '' | 'seg-ok' | 'seg-run' | 'seg-bad' | 'seg-fut';
    hint?: string;
}

export interface StepTimelineTodayMarker {
    left: number;
    width: number;
    styleClass?: '' | 'is-late' | 'is-run';
}

@Component({
               selector: 'app-step-timeline',
               standalone: true,
               templateUrl: './step-timeline.component.html',
               styleUrl: './step-timeline.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class StepTimelineComponent {
    readonly steps = input<StepTimelineStep[]>([]);
    readonly todayMarker = input<StepTimelineTodayMarker | null>(null);
    readonly todayTitle = input<string | null>(null);
    readonly segments = input<boolean>(true);
}
