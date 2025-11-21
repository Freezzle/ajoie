import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {DatePipe} from "@angular/common";

interface ComputedTimelinePoint extends DateTimelinePoint {
    position: number; // 0–100 (%)
    clamped: boolean; // true si la date est hors [start, end]
}

@Component({
    selector: 'timeline-dot',
    imports: [
        DatePipe
    ],
    templateUrl: './timeline-dot.component.html',
    styleUrl: './timeline-dot.component.scss',
})
export class TimelineDotComponent implements OnChanges {
    /**
     * Date de début de la timeline (incluse)
     */
    @Input() startDate!: Date;

    /**
     * Date de fin de la timeline (incluse)
     */
    @Input() endDate!: Date;

    /**
     * Liste des points à afficher
     */
    @Input() points: DateTimelinePoint[] = [];

    /**
     * Points enrichis avec la position en %
     */
    computedPoints: ComputedTimelinePoint[] = [];

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.startDate || !this.endDate) {
            this.computedPoints = [];
            return;
        }

        const start = new Date(this.startDate).getTime();
        const end = new Date(this.endDate).getTime();

        // Evite la division par zéro si start == end
        const totalDuration = end - start || 1;

        this.computedPoints = (this.points || []).map((p) => {
            const time = new Date(p.date).getTime();
            let ratio = (time - start) / totalDuration;
            const clamped = ratio < 0 || ratio > 1;

            // Clamp dans [0, 1] pour rester sur la ligne
            if (ratio < 0) {ratio = 0;}
            if (ratio > 1) {ratio = 1;}

            return {
                ...p,
                position: ratio * 100,
                clamped,
            };
        });
    }
}

export interface DateTimelinePoint {
    date: Date;      // la date du point
    label: string | null;   // texte à afficher sous le point
    isMilestone: boolean;
}