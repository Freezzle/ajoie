import {Component, inject, OnInit} from '@angular/core';
import {HttpResponse} from '@angular/common/http';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {filter, Observable, of, switchMap, tap} from 'rxjs';
import {catchError, finalize, map, shareReplay} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';

import {ParticipationService} from '../service/participation.service';
import {getFormattedParticipationName, IParticipation} from '../model/participation.interface';
import {ParticipationFormGroup, ParticipationFormService} from '../service/participation-form.service';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import StatusPipe from '../../../shared/pipe/status.pipe';
import {ConferenceService} from '../../conference/service/conference.service';
import {IStand} from '../../stand/model/stand.interface';
import {StandService} from '../../stand/service/stand.service';
import {ISalon} from '../../salon/model/salon.interface';
import {SalonService} from '../../salon/service/salon.service';
import {IExhibitor, selectFilterExhibitor} from '../../exhibitor/model/exhibitor.interface';
import {ExhibitorService, formatterExhibitor} from '../../exhibitor/service/exhibitor.service';
import {formatterStatus, Status} from '../../enumerations/status.model';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {LinkBoxComponent} from '../../../shared/components/link-box/link-box.component';
import {SelectBoxComponent} from '../../../shared/components/select-box/select-box.component';
import {DateBoxComponent} from '../../../shared/components/date-box/date-box.component';
import {NumberBoxComponent} from '../../../shared/components/number-box/number-box.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {CheckboxBoxComponent} from '../../../shared/components/checkbox-box/checkbox-box.component';
import {IConference} from '../../conference/model/conference.interface';
import {ActionsService} from '../../common/actions.service';
import {AvailableAction} from '../../../shared/model/available-action';
import {EmailDialogComponent} from '../../../shared/email-dialog/email-dialog.component';
import {EmailMessage} from '../../../shared/email-dialog/email-message';
import {EventModalComponent} from '../../../shared/event-modal/event-modal.component';
import {IWorkshop} from '../../workshop/model/workshop.interface';
import {WorkshopService} from '../../workshop/service/workshop.service';
import {formatterModePaymentMeals, ModePaymentMeals} from '../../enumerations/mode-payment-meals.model';
import {formatterInvoiceMethod, InvoiceSendingMethod} from '../../enumerations/invoice-sending-method.model';
import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';
import {AlertComponent} from '../../../shared/alert/alert.component';
import {ConfirmDialogService} from '../../../shared/delete-dialog/confirm-dialog.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmPopup} from 'primeng/confirmpopup';
import {Toast} from 'primeng/toast';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {Badge} from 'primeng/badge';
import {Tag} from 'primeng/tag';
import {CardComponent} from '../../../shared/components/card/card.component';
import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {MenuBoxComponent} from '../../../shared/components/menu-box/menu-box.component';
import {MenuItem, PrimeIcons} from 'primeng/api';
import {TranslateService} from '@ngx-translate/core';
import {TableModule} from 'primeng/table';
import {NavigationStateService} from '../../../layouts/navbar/navigation-state.service';
import {Rating} from 'primeng/rating';
import {RatingBoxComponent} from '../../../shared/rating-box/rating-box.component';

@Component({
               selector: 'app-participation-update',
               templateUrl: './participation-update.component.html',
               imports: [SharedModule, RouterModule, FormsModule, ReactiveFormsModule, ColorStatusPipe, StatusPipe,
                         ButtonBoxComponent, LinkBoxComponent, SelectBoxComponent, DateBoxComponent,
                         NumberBoxComponent, TextBoxComponent, TextareaBoxComponent, CheckboxBoxComponent, AlertErrorComponent, AlertComponent, ConfirmPopup, Toast, Tab, TabList, Tabs, TabPanels, TabPanel, Badge, Tag, CardComponent, ContentPageComponent, MenuBoxComponent, TableModule, Rating, RatingBoxComponent]
           })
export class ParticipationUpdateComponent implements OnInit {
    tabActive = '0';
    isLoading = false;
    isReadOnly = false;
    eventId!: string;
    isNew: boolean = false;
    initialParticipation: IParticipation | null = null;
    statusValues = Object.keys(Status);
    modePaymentMealsValues = Object.keys(ModePaymentMeals);
    invoiceSendingMethodValues = Object.keys(InvoiceSendingMethod);
    exhibitorsOptions: IExhibitor[] = [];
    menuCache: MenuItem[] = [];
    conferences$: Observable<IConference[]> | undefined;
    workshops$: Observable<IWorkshop[]> | undefined;
    stands$: Observable<IStand[]> | undefined;
    protected participationService = inject(ParticipationService);
    protected participationFormService = inject(ParticipationFormService);
    editForm: FormGroup<ParticipationFormGroup> = this.participationFormService.createParticipationFormGroup(null);
    protected conferenceService = inject(ConferenceService);
    protected standService = inject(StandService);
    protected stateService = inject(NavigationStateService);
    protected workshopService = inject(WorkshopService);
    protected exhibitorService = inject(ExhibitorService);
    protected salonService = inject(SalonService);
    protected activatedRoute = inject(ActivatedRoute);
    protected confirmDialogService = inject(ConfirmDialogService);
    protected modalService = inject(NgbModal);
    protected actionsService = inject(ActionsService);
    protected translateService = inject(TranslateService);
    protected router = inject(Router);
    protected readonly formatterStatus = formatterStatus;
    protected readonly formatterExhibitor = formatterExhibitor;
    protected readonly formatterModePaymentMeals = formatterModePaymentMeals;
    protected readonly formatterInvoiceMethod = formatterInvoiceMethod;
    protected readonly selectFilterExhibitor = selectFilterExhibitor;

    ngOnInit(): void {
        const data = this.activatedRoute.snapshot.data;
        this.eventId = this.activatedRoute.snapshot.paramMap.get('idSalon')!;

        this.load({...data['participation']}, data['readonly']);
    }

    loadStandsOnce(): Observable<IStand[]> {
        if (!this.initialParticipation?.id) {
            return of([]);
        }
        if (!this.stands$) {
            const queryObject = {idParticipation: this.initialParticipation.id};
            this.stands$ = this.standService.query(queryObject).pipe(
                map(res => res ?? []),
                catchError(() => of([])),
                shareReplay(1)
            );
        }
        return this.stands$;
    }

    loadConferencesOnce(): Observable<IConference[]> {
        if (!this.initialParticipation?.id) {
            return of([]);
        }
        if (!this.conferences$) {
            const queryObject = {idParticipation: this.initialParticipation.id};
            this.conferences$ = this.conferenceService.query(queryObject).pipe(
                map(res => res ?? []),
                catchError(() => of([])),
                shareReplay(1)
            );
        }
        return this.conferences$;
    }

    loadWorkshopsOnce(): Observable<IWorkshop[]> {
        if (!this.initialParticipation?.id) {
            return of([]);
        }
        if (!this.workshops$) {
            const queryObject = {idParticipation: this.initialParticipation.id};
            this.workshops$ = this.workshopService.query(queryObject).pipe(
                map(res => res ?? []),
                catchError(() => of([])),
                shareReplay(1)
            );
        }
        return this.workshops$;
    }

    edit(): void {
        this.isReadOnly = false;
        this.editForm.enable();
    }

    previousState(): void {
        window.history.back();
    }

    cancel(): void {
        this.isReadOnly = true;
        this.editForm = this.participationFormService.createParticipationFormGroup(this.initialParticipation);
        this.editForm.disable();
    }

    save(): void {
        if (this.editForm.invalid) {
            this.editForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;

        const participation = this.participationFormService.getParticipation(this.editForm);
        const saveOperation = participation.id != null
                              ? this.participationService.update(participation)
                              : this.participationService.create(participation);

        saveOperation.pipe(finalize(() => (this.isLoading = false)),
                           tap((part) => {
                               if (this.isNew) {
                                   this.router.navigate(['../', part.body?.id, 'view'], {
                                       relativeTo: this.activatedRoute,
                                       replaceUrl: true
                                   });
                               } else {
                                   this.load(part.body, true);
                               }
                           }))
                     .subscribe();
    }

    deleteEntity(htmlElement: HTMLElement, entity: IConference | IStand | IWorkshop, type: 'conference' | 'stand' | 'workshop'): void {
        const participationId = this.initialParticipation?.id;
        if (!participationId) {
            return;
        }

        this.confirmDialogService.delete(htmlElement, `${type}.delete.question`, type === 'conference' ? {title: (entity as IConference).title} : type === 'stand' ?
            {description: getFormattedParticipationName((entity as IStand).participation)} : {title: (entity as IWorkshop).title})
            .pipe(
                filter(confirmed => confirmed),
                switchMap(() => type === 'conference' ? this.conferenceService.delete(entity.id) : type === 'stand' ? this.standService.delete(entity.id) : this.workshopService.delete(entity.id)),
                switchMap(() => this.participationService.find(participationId)))
            .subscribe((participation) => this.load(participation.body, this.isReadOnly));
    }

    clickAction(action: AvailableAction): void {
        const participationId = this.initialParticipation?.id;
        if (!participationId) {
            return;
        }

        if (action.type === 'EMAIL') {
            this.openEmailPopup(action, participationId);
        } else if (action.type === 'DOWNLOAD') {
            this.isLoading = true;
            this.actionsService.downloadAction(action.contextCode, participationId)
                .pipe(finalize(() => this.isLoading = false)).subscribe(res => {
                const cd = res.headers.get('content-disposition') ?? '';
                const filename = this.getFilenameFromContentDisposition(cd) ?? 'document.pdf';

                const blob = res.body!;
                const url = window.URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = filename;   // ✅ c’est ça qui impose le nom
                a.click();

                window.URL.revokeObjectURL(url);
            });
        } else if (action.type === 'BUSINESS') {
            this.isLoading = true;
            this.actionsService.businessAction(action.contextCode, participationId)
                .pipe(
                    finalize(() => this.isLoading = false),
                    switchMap(() => this.participationService.find(participationId)))
                .subscribe((participation) => this.load(participation.body, this.isReadOnly));
        } else {
            console.warn('Action type unknown : ' + action.type);
        }
    }

    openEmailPopup(action: AvailableAction, id: string) {
        const participationId = this.initialParticipation?.id;
        if (!participationId) {
            return;
        }
        this.actionsService.templateEmailAction(action.contextCode, id).subscribe(template => {
            const modalRef = this.modalService.open(EmailDialogComponent, {size: 'xl'});
            modalRef.componentInstance.template = template;
            modalRef.componentInstance.context = action.contextCode;
            modalRef.componentInstance.entityId = id;

            modalRef.result.then((result: EmailMessage) => {
                if (result) {
                    this.isLoading = true;
                    this.actionsService.emailAction(action.contextCode, id, result)
                        .pipe(finalize(() => this.isLoading = false),
                              switchMap(() => this.participationService.find(participationId)))
                        .subscribe((participation) => this.load(participation.body, this.isReadOnly));
                }
            });
        });
    }

    openHistoryModal(): void {
        this.participationService.getEventLogs(this.initialParticipation!.id).subscribe(events => {
            const modalRef = this.modalService.open(EventModalComponent, {size: 'lg'});
            modalRef.componentInstance.events = events.body ?? [];
        });
    }

    buildInvoicingPlanMenuItems(availableActions: AvailableAction[]): MenuItem[] {
        const items: MenuItem[] = [];

        for (const action of availableActions ?? []) {
            items.push({
                           label: this.translateService.instant(action.labelKey) as string,
                           disabled: action.disabled,
                           command: () => this.clickAction(action),
                           data: {type: action.type},
                           icon: action.type === 'EMAIL' ? PrimeIcons.ENVELOPE
                                                         : action.type === 'DOWNLOAD' ? PrimeIcons.FILE_PDF
                                                                                      : action.type === 'BUSINESS' ? PrimeIcons.BOLT : undefined
                       });
        }
        return items;
    }

    protected loadRelationshipsOptions(participation: IParticipation | null): void {
        this.exhibitorService
            .query()
            .pipe(map((res: HttpResponse<IExhibitor[]>) => res.body ?? []))
            .subscribe((exhibitors: IExhibitor[]) => (this.exhibitorsOptions = exhibitors));

        this.salonService
            .find(this.eventId)
            .pipe(map((res: HttpResponse<ISalon>) => {
                const salon = res.body ?? null;
                this.editForm.controls.salon.setValue(salon ?? null);
            }))
            .subscribe();
    }

    private load(participation: IParticipation | null, readonly: boolean): void {
        this.stands$ = undefined;
        this.conferences$ = undefined;
        this.workshops$ = undefined;

        this.initialParticipation = participation;
        this.editForm = this.participationFormService.createParticipationFormGroup(this.initialParticipation);

        this.isNew = !this.editForm.controls.id.value;
        if (readonly) {
            this.isReadOnly = true;
            this.editForm.disable();
            if (this.initialParticipation) {
                this.actionsService.getAvailableActions('participation', this.initialParticipation.id).subscribe(availableActions => {
                    this.menuCache = this.buildInvoicingPlanMenuItems(availableActions);
                });
            }
        } else {
            this.edit();
        }

        this.loadRelationshipsOptions(this.initialParticipation);
    }

    private getFilenameFromContentDisposition(cd: string): string | null {
        // gère filename*=UTF-8''... et filename="..."
        const utf8 = cd.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
        if (utf8?.[1]) {
            return decodeURIComponent(utf8[1]);
        }

        const ascii = cd.match(/filename\s*=\s*"([^"]+)"/i) ?? cd.match(/filename\s*=\s*([^;]+)/i);
        return ascii?.[1]?.trim() ?? null;
    }
}
