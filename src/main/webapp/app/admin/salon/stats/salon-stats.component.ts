import {Component, ElementRef, inject, input, LOCALE_ID, OnInit, ViewChild} from '@angular/core';
import {RouterModule} from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import {ISalon} from '../model/salon.interface';
import {SalonService} from '../service/salon.service';
import {mergeMap} from 'rxjs/operators';
import {combineLatest, EMPTY, Observable, of} from 'rxjs';
import {HttpResponse} from '@angular/common/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Status} from '../../enumerations/status.model';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {ISalonStats} from '../model/salon-stats.interface';
import {getFormattedParticipationName} from '../../participation/model/participation.interface';
import {Toast, ToastModule} from "primeng/toast";
import {MessageService} from "primeng/api";
import {formatDate} from "@angular/common";

@Component({
    selector: 'jhi-salon-stats',
    templateUrl: './salon-stats.component.html',
    styleUrl: './salon-stats.component.scss',
    imports: [
        SharedModule,
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        ToastModule,
        ButtonBoxComponent,
        Toast,
    ]
})
export class SalonStatsComponent implements OnInit {
    @ViewChild('fileInput') fileInput!: ElementRef;

    salon = input<ISalon | null>(null);
    combinedStats$: Observable<ISalonStats[]> | undefined;
    selectedFile: File | null = null;
    protected salonService = inject(SalonService);
    private readonly messageService = inject(MessageService);
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
                }),
            ),
            this.salonService.stats(this.salon()!.id, [Status.ACCEPTED, Status.VALIDATED, Status.CLOSED]).pipe(
                mergeMap((stats: HttpResponse<ISalonStats>) => {
                    if (stats.body) {
                        return of(stats.body);
                    }
                    return EMPTY;
                }),
            ),
            this.salonService.stats(this.salon()!.id, [Status.CANCELED, Status.REFUSED]).pipe(
                mergeMap((stats: HttpResponse<ISalonStats>) => {
                    if (stats.body) {
                        return of(stats.body);
                    }
                    return EMPTY;
                }),
            ),
        ]);
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedFile = input.files[0];
        }
    }

    importFile(): void {
        if (this.selectedFile == null) {
            return;
        }

        this.salonService.generate(this.salon()!.id, this.selectedFile!).subscribe((participationsNew) => {
            const detailMessage = participationsNew.map(part => {
                const therapistName = part.therapistName?.length > 10 ? part.therapistName.slice(0, 10) + '...' : part.therapistName;
                return '<' + therapistName + '> inscrit le ' + (!!part.registrationDate
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

            if (this.fileInput) {
                this.fileInput.nativeElement.value = ''; // Reset the file input field
            }

            this.selectedFile = null;
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

    protected readonly getFormattedParticipationName = getFormattedParticipationName;
}
