import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {combineLatest, filter, switchMap, tap} from 'rxjs';

import SharedModule from 'app/shared/shared.module';
import {FormatMediumDatePipe} from 'app/shared/date';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {getFormattedParticipationName, IInfoInvoice, IParticipation} from '../model/participation.interface';
import {ParticipationService} from '../service/participation.service';
import {getExhibitorFullName, IExhibitor} from '../../exhibitor/model/exhibitor.interface';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import StatusPipe from '../../../shared/pipe/status.pipe';
import {Status} from '../../enumerations/status.model';
import {finalize} from 'rxjs/operators';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {ConfirmPopup} from 'primeng/confirmpopup';

import {ConfirmDialogService} from '../../../shared/delete-dialog/confirm-dialog.service';

import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';
import {TableModule} from 'primeng/table';
import {DateTimelinePoint, TimelineDotComponent} from '../../../shared/components/timeline-dot/timeline-dot.component';
import {NavigationStateService} from '../../../layouts/navbar/navigation-state.service';
import {OverlayBadge} from 'primeng/overlaybadge';
import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {CardComponent} from '../../../shared/components/card/card.component';
import {IconField} from 'primeng/iconfield';
import {InputIcon} from 'primeng/inputicon';
import {InputText} from 'primeng/inputtext';
import {MultiSelect} from 'primeng/multiselect';
import {SplitMenuBoxComponent} from '../../../shared/components/split-menu-box/split-menu-box.component';
import {TranslateService} from '@ngx-translate/core';
import {MenuItem} from 'primeng/api';
import {copyToClipboard} from '../../../core/util/utils';

@Component({
               selector: 'app-participation',
               templateUrl: './participation.component.html',
               imports: [
                   RouterModule,
                   FormsModule,
                   SharedModule,
                   FormatMediumDatePipe,
                   ColorStatusPipe,
                   StatusPipe,
                   ReactiveFormsModule,
                   ButtonBoxComponent,
                   ConfirmPopup,
                   
                   
                   AlertErrorComponent,
                   TableModule,
                   TimelineDotComponent,
                   OverlayBadge,
                   ContentPageComponent,
                   CardComponent,
                   IconField,
                   InputIcon,
                   InputText,
                   MultiSelect,
                   SplitMenuBoxComponent
               ]
           })
export class ParticipationComponent implements OnInit {
    participations = signal<IParticipation[]>([]);
    isLoading = false;
    statusValues = Object.keys(Status);
    infoInvoicesMap: { [id: string]: IInfoInvoice } = {};
    protected confirmDialogService = inject(ConfirmDialogService);
    protected readonly navigationStateService = inject(NavigationStateService);
    private readonly participationService = inject(ParticipationService);
    private readonly translateService = inject(TranslateService);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly idSalon = signal<string | null>(null);

    /**
     * Le salon est chargé de manière asynchrone par la navbar : on ne l'utilise que
     * lorsqu'il correspond réellement au salon de la route courante.
     */
    private readonly currentSalon = computed(() => {
        const idSalon = this.idSalon();
        const salon = this.navigationStateService.salon();

        return idSalon && salon?.id === idSalon ? salon : null;
    });

    readonly timelineStart = computed(() => {
        const startingDate = this.currentSalon()?.startingDate;
        if (!startingDate) {
            return null;
        }

        const start = new Date(startingDate);
        start.setMonth(start.getMonth() - 7);

        return start;
    });

    readonly timelineEnd = computed(() => {
        const endingDate = this.currentSalon()?.endingDate;

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
        combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(
            ([params]) => {
                const idSalon = params.get('idSalon')!;
                if (this.idSalon() === idSalon) {
                    return;
                }

                this.idSalon.set(idSalon);
                this.participations.set([]);
                this.infoInvoicesMap = {};

                this.load();
                this.participationService.getInfosInvoiceForSalon(idSalon).subscribe(infoInvoicesMap => {
                    if (this.idSalon() !== idSalon) {
                        return;
                    }

                    this.infoInvoicesMap = infoInvoicesMap || {};
                });
            });
    }

    delete(htmlElement: HTMLElement, participation: IParticipation): void {
        this.confirmDialogService.delete(htmlElement, 'participation.delete.question', {
            fullName: getFormattedParticipationName(participation)
        }).pipe(
            filter(confirmed => confirmed),
            switchMap(() => this.participationService.delete(participation.id)),
            tap(() => this.load()) // Recharge les données
        ).subscribe();
    }

    readonly actionMenuItems: MenuItem[] = [
        {
            label: this.translateService.instant('common.refresh') as string,
            icon: 'pi pi-sync',
            command: () => this.refresh()
        },
        {
            label: this.translateService.instant('common.create') as string,
            icon: 'pi pi-plus',
            command: () => this.router.navigate(['./new'], {relativeTo: this.activatedRoute})
        },
        {
            label: this.translateService.instant('participation.copyActiveExhibitorEmails') as string,
            icon: 'pi pi-copy',
            command: () => this.clipboardActiveExhibitorEmails()
        }
    ];

    clipboardActiveExhibitorEmails(): void {
        this.isLoading = true;

        this.participationService.getExhibitorEmailsWithActiveParticipations()
            .pipe(finalize(() => this.isLoading = false))
            .subscribe(emails => {
                copyToClipboard(emails.join(','));
            });
    }

    load(): void {
        const idSalon = this.idSalon();
        if (!idSalon) {
            return;
        }

        this.isLoading = true;

        this.participationService
            .query(idSalon)
            .pipe(finalize(() => (this.isLoading = false)))
            .subscribe(result => {
                // le salon a pu changer pendant la requête : on ignore une réponse obsolète
                if (this.idSalon() !== idSalon) {
                    return;
                }

                this.participations.set(result.body ?? []);
            });
    }

    getInfoInvoice(idParticipation: string): IInfoInvoice {
        return this.infoInvoicesMap[idParticipation];
    }

    getExhibitorFullName(exhibitor: IExhibitor | null | undefined): string {
        return getExhibitorFullName(exhibitor);
    }

    refresh(): void {
        this.load();
    }

    previousState(): void {
        window.history.back();
    }
}
