import {Component, computed, inject, input, LOCALE_ID, OnInit, signal, ViewChild} from '@angular/core';
import {RouterModule} from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import {ISalon} from '../model/salon.interface';
import {SalonService} from '../service/salon.service';
import {mergeMap} from 'rxjs/operators';
import {combineLatest, EMPTY, Observable, of} from 'rxjs';
import {HttpResponse} from '@angular/common/http';
import {Status} from '../../enumerations/status.model';
import {ISalonStats} from '../model/salon-stats.interface';
import {ToastModule} from 'primeng/toast';
import {MessageService} from 'primeng/api';
import {FileUpload, FileUploadHandlerEvent} from 'primeng/fileupload';
import {formatDate} from '@angular/common';

import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';
import {ConfirmPopup} from 'primeng/confirmpopup';
import {CardComponent} from '../../../shared/components/card/card.component';
import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {NavigationStateService} from '../../../layouts/navbar/navigation-state.service';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {
    DateTimelinePoint,
    TimelineDotComponent
} from '../../../shared/components/timeline-dot/timeline-dot.component';
import {ParticipationService} from '../../participation/service/participation.service';
import {IParticipation} from '../../participation/model/participation.interface';

@Component({
               selector: 'app-salon-stats',
               templateUrl: './salon-stats.component.html',
               styleUrl: './salon-stats.component.scss',
               imports: [
                   SharedModule,
                   RouterModule,
                   ToastModule,
                   FileUpload,
                   AlertErrorComponent,
                   ConfirmPopup,
                   CardComponent,
                   ContentPageComponent,
                   ButtonBoxComponent,
                   TimelineDotComponent
               ]
           })
export class SalonStatsComponent implements OnInit {
    @ViewChild('fileUploader') fileUploader!: FileUpload;

    salon = input<ISalon | null>(null);
    combinedStats$: Observable<ISalonStats[]> | undefined;
    protected salonService = inject(SalonService);
    private readonly messageService = inject(MessageService);
    readonly navigationService = inject(NavigationStateService);
    private readonly locale = inject(LOCALE_ID);
    private readonly participationService = inject(ParticipationService);

    /** Inscriptions du salon, utilisées par la ligne de temps. */
    readonly participations = signal<IParticipation[]>([]);

    readonly timelineStart = computed(() => {
        const startingDate = this.salon()?.startingDate;
        if (!startingDate) {
            return null;
        }

        const start = new Date(startingDate);
        start.setMonth(start.getMonth() - 7);

        return start;
    });

    readonly timelineEnd = computed(() => {
        const endingDate = this.salon()?.endingDate;

        return endingDate ? new Date(endingDate) : null;
    });

    readonly points = computed<DateTimelinePoint[]>(() => {
        const start = this.timelineStart();
        const end = this.timelineEnd();

        if (!start || !end) {
            return [];
        }

        const points: DateTimelinePoint[] = this.participations()
                                                .filter(participation => !!participation.registrationDate)
                                                .map(participation => ({
                                                    date: new Date(participation.registrationDate!),
                                                    label: null,
                                                    kind: 'registration' as const
                                                }));

        // on normalise end pour comparaison
        const lastMoment = new Date(end);
        lastMoment.setHours(23, 59, 59, 999);

        // on part du 1er du mois suivant celui de start, à minuit
        const cursor = new Date(start);
        cursor.setDate(1);
        cursor.setHours(0, 0, 0, 0);
        cursor.setMonth(cursor.getMonth() + 1);

        while (cursor <= lastMoment) {
            points.push({
                            date: new Date(cursor),
                            label: cursor.toLocaleDateString('fr-CH', {
                                month: '2-digit',
                                year: 'numeric'
                            }),
                            kind: 'month'
                        });

            cursor.setMonth(cursor.getMonth() + 1);
        }

        const today = new Date();
        if (today >= start && today <= lastMoment) {
            points.push({date: today, label: 'Aujourd\'hui', kind: 'today'});
        }

        return points.sort((a, b) => a.date.getTime() - b.date.getTime());
    });

    ngOnInit(): void {
        this.loadStats();
        this.loadParticipations();
    }

    loadParticipations(): void {
        const idSalon = this.salon()?.id;
        if (!idSalon) {
            return;
        }

        this.participationService.query(idSalon)
            .subscribe(result => this.participations.set(result.body ?? []));
    }

    packStatsByKey(cancelledDimensions: Record<string, number>,
                   runningDimensions: Record<string, number>,
                   acceptedDimensions: Record<string, number>): [string, [number, number, number]][] {
        const result: Record<string, [number, number, number]> = {};

        // Ajouter les valeurs de runningDimensions
        for (const [key, value] of Object.entries(runningDimensions)) {
            result[key] = [value, acceptedDimensions[key] ?? 0, cancelledDimensions[key] ?? 0];
        }

        // Ajouter les valeurs de acceptedDimensions qui ne sont pas dans runningDimensions
        for (const [key, value] of Object.entries(acceptedDimensions)) {
            if (!(key in result)) {
                result[key] = [0, value, 0];
            }
        }

        // Ajouter les valeurs de runningDimensions
        for (const [key, value] of Object.entries(cancelledDimensions)) {
            if (!(key in result)) {
                result[key] = [0, 0, value];
            }
        }

        return Object.entries(result);
    }

    loadStats(): void {
        this.combinedStats$ = combineLatest([
                                                this.salonService.stats(this.salon()!.id, [Status.IN_VERIFICATION]).pipe(
                                                    mergeMap((stats: HttpResponse<ISalonStats>) => {
                                                        if (stats.body) {
                                                            return of(stats.body);
                                                        }
                                                        return EMPTY;
                                                    })
                                                ),
                                                this.salonService.stats(this.salon()!.id, [Status.ACCEPTED, Status.VALIDATED, Status.CLOSED]).pipe(
                                                    mergeMap((stats: HttpResponse<ISalonStats>) => {
                                                        if (stats.body) {
                                                            return of(stats.body);
                                                        }
                                                        return EMPTY;
                                                    })
                                                ),
                                                this.salonService.stats(this.salon()!.id, [Status.CANCELED, Status.REFUSED]).pipe(
                                                    mergeMap((stats: HttpResponse<ISalonStats>) => {
                                                        if (stats.body) {
                                                            return of(stats.body);
                                                        }
                                                        return EMPTY;
                                                    })
                                                )
                                            ]);
    }

    importFile(event: FileUploadHandlerEvent): void {
        const file = event.files[0];
        if (!file) {
            return;
        }

        this.salonService.generate(this.salon()!.id, file).subscribe((participationsNew) => {
            const detailMessage = participationsNew.map(part => {
                const therapistName = part.therapistName?.length > 10 ? part.therapistName.slice(0, 10) + '...' : part.therapistName;
                return '<' + therapistName + '> inscrit le ' + (part.registrationDate
                                                                ? formatDate(part.registrationDate, 'dd.MM.yyyy HH:mm', this.locale)
                                                                : '-');
            });

            this.messageService.add({
                                        severity: 'info',
                                        summary: 'Résultat',
                                        detail: 'Nombre d\'inscriptions importées : ' + participationsNew.length + '\n\n' + detailMessage.join('\n'),
                                        closable: true,
                                        sticky: true
                                    });

            this.fileUploader.clear();
            this.loadStats();
            this.loadParticipations();
        });
    }

    previousState(): void {
        window.history.back();
    }

    calculateFacturation(stat: {
        paid: number, discount: number, expected: number, total: number, remaining: number
    }): [number, number, number] {
        const resultDiscount = stat.discount / stat.total * 100;
        const resultPaid = (stat.paid / (stat.total)) * 100;
        const remaining = 100 - resultDiscount - resultPaid;

        return [remaining, resultPaid, resultDiscount];
    }
}
