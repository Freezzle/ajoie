import {Component, inject, input, LOCALE_ID, OnInit, ViewChild} from '@angular/core';
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
                   ButtonBoxComponent
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

    ngOnInit(): void {
        this.loadStats();
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
