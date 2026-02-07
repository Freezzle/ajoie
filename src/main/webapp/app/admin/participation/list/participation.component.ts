import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap, Router, RouterModule} from '@angular/router';
import {combineLatest, filter, switchMap, tap} from 'rxjs';

import SharedModule from 'app/shared/shared.module';
import {FormatMediumDatePipe} from 'app/shared/date';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {getFormattedParticipationName, IInfoInvoice, IParticipation} from '../model/participation.interface';
import {ParticipationService} from '../service/participation.service';
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
    participations: IParticipation[] = [];
    isLoading = false;
    statusValues = Object.keys(Status);
    params!: ParamMap;
    infoInvoicesMap: { [id: string]: IInfoInvoice } = {};
    points: DateTimelinePoint[] = [];
    start: Date | undefined;
    end: Date | undefined;
    protected confirmDialogService = inject(ConfirmDialogService);
    protected readonly navigationStateService = inject(NavigationStateService);
    private readonly participationService = inject(ParticipationService);
    private readonly translateService = inject(TranslateService);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly router = inject(Router);

    ngOnInit(): void {
        combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(
            ([params]) => {
                this.params = params;

                if (!this.participations || this.participations.length === 0) {
                    this.load();
                    this.participationService.getInfosInvoiceForSalon(this.params.get('idSalon')!).subscribe(infoInvoicesMap => {
                        this.infoInvoicesMap = infoInvoicesMap || {};
                    });
                }
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
        }
    ];

    load(): void {
        this.isLoading = true;
        const idSalon = this.params.get('idSalon')!;

        this.participationService
            .query(idSalon)
            .pipe(finalize(() => (this.isLoading = false)))
            .subscribe(result => {
                this.participations = result.body ?? [];
                this.points = this.participations.map(part => ({
                    date: part.registrationDate!,
                    label: null,
                    isMilestone: false
                } as DateTimelinePoint));

                this.start = this.navigationStateService.salon()?.startingDate;
                if (this.start) {
                    const startMinus6Months = new Date(this.start);
                    startMinus6Months.setMonth(startMinus6Months.getMonth() - 7);
                    this.start = startMinus6Months;
                }

                this.end = this.navigationStateService.salon()?.endingDate;

                if (this.start && this.end) {
                    const milestones: DateTimelinePoint[] = [];

                    // on part du 1er du mois de start, à minuit
                    const cursor = new Date(this.start);
                    cursor.setDate(1);
                    cursor.setHours(0, 0, 0, 0);
                    cursor.setMonth(cursor.getMonth() + 1);

                    // on normalise end pour comparaison
                    const end = new Date(this.end);
                    end.setHours(23, 59, 59, 999);

                    while (cursor <= end) {
                        milestones.push({
                                            date: new Date(cursor),
                                            label: cursor.toLocaleDateString('fr-CH', {
                                                month: '2-digit',
                                                year: 'numeric'
                                            }),
                                            isMilestone: true
                                        });

                        cursor.setMonth(cursor.getMonth() + 1);
                    }

                    // Jalons + "Aujourd'hui"
                    this.points.push(...milestones);
                }

                if (new Date() <= this.end!) {
                    this.points.push({date: new Date(), label: 'Aujourd\'hui', isMilestone: true});
                }

                this.points.sort((a, b) => a.date.getTime() - b.date.getTime());
            });
    }

    getInfoInvoice(idParticipation: string): IInfoInvoice {
        return this.infoInvoicesMap[idParticipation];
    }

    refresh(): void {
        this.load();
    }

    previousState(): void {
        window.history.back();
    }
}
