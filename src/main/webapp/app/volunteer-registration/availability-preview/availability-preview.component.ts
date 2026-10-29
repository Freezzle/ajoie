import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {VolunteerAvatarComponent} from '../../shared/components/volunteer-avatar/volunteer-avatar.component';
import {ITimeRange, toMinutes} from '../volunteer-availability.util';

export type PreviewDayState = 'available' | 'no' | 'unanswered';

export interface PreviewDay {
    id: string;
    shortLabel: string; // "Jeu 12"
    startTime: string;  // "HH:mm" heures d'ouverture
    endTime: string;
    state: PreviewDayState;
    ranges: ITimeRange[];
}

interface Bar {
    left: number;
    width: number;
    label: string;
    showLabel: boolean;
}

interface Tick {
    left: number;
    label: string;
}

/**
 * Aperçu « Votre ligne dans le planning des bénévoles ». Axe horaire commun à tous les jours,
 * positions relatives en % (jamais de défilement horizontal).
 */
@Component({
               selector: 'app-availability-preview',
               standalone: true,
               changeDetection: ChangeDetectionStrategy.OnPush,
               imports: [TranslatePipe, VolunteerAvatarComponent],
               templateUrl: './availability-preview.component.html',
               styleUrl: './availability-preview.component.scss'
           })
export class AvailabilityPreviewComponent {
    readonly name = input<string>('');
    readonly days = input.required<PreviewDay[]>();

    private readonly axis = computed(() => {
        const days = this.days();
        if (!days.length) {
            return {start: 0, end: 1};
        }
        const start = Math.min(...days.map(d => toMinutes(d.startTime)));
        const end = Math.max(...days.map(d => toMinutes(d.endTime)));
        return {start, end: Math.max(end, start + 1)};
    });

    readonly ticks = computed<Tick[]>(() => {
        const {start, end} = this.axis();
        const ticks: Tick[] = [];
        // Une graduation toutes les 2h, alignée sur les heures paires.
        const firstEven = Math.ceil(start / 120) * 120;
        for (let m = firstEven; m <= end; m += 120) {
            ticks.push({left: this.pct(m), label: `${Math.floor(m / 60)}h`});
        }
        return ticks;
    });

    readonly totalHours = computed(() => {
        let minutes = 0;
        for (const day of this.days()) {
            if (day.state === 'available') {
                for (const range of day.ranges) {
                    minutes += toMinutes(range.end) - toMinutes(range.start);
                }
            }
        }
        return minutes / 60;
    });

    readonly availableDayCount = computed(() =>
        this.days().filter(d => d.state === 'available' && d.ranges.length > 0).length);

    openingLeft(day: PreviewDay): number {
        return this.pct(toMinutes(day.startTime));
    }

    totalOf(day: PreviewDay): number {
        let minutes = 0;
        for (const range of day.ranges) {
            minutes += toMinutes(range.end) - toMinutes(range.start);
        }
        return minutes / 60;
    }

    openingWidth(day: PreviewDay): number {
        return this.pct(toMinutes(day.endTime)) - this.pct(toMinutes(day.startTime));
    }

    barsOf(day: PreviewDay): Bar[] {
        return day.ranges.map(range => {
            const start = toMinutes(range.start);
            const end = toMinutes(range.end);
            const width = this.pct(end) - this.pct(start);
            return {
                left: this.pct(start),
                width,
                label: `${range.start.slice(0, 2)}–${range.end.slice(0, 2)}h`,
                showLabel: width > 12
            };
        });
    }

    private pct(minutes: number): number {
        const {start, end} = this.axis();
        return ((minutes - start) / (end - start)) * 100;
    }
}
