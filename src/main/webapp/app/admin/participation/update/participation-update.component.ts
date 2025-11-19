import {Component, inject, OnInit} from '@angular/core';
import {HttpResponse} from '@angular/common/http';
import {ActivatedRoute, ParamMap, RouterModule} from '@angular/router';
import {combineLatest, filter, Observable, of, switchMap} from 'rxjs';
import {catchError, finalize, map, shareReplay} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';

import {formatterParticipation, ParticipationService} from '../service/participation.service';
import {getFormattedParticipationName, IParticipation} from '../model/participation.interface';
import {ParticipationFormGroup, ParticipationFormService} from '../service/participation-form.service';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import StatusPipe from '../../../shared/pipe/status.pipe';
import {ITEM_DELETED_EVENT} from '../../../config/navigation.constants';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ConferenceService} from '../../conference/service/conference.service';
import {IStand} from '../../stand/model/stand.interface';
import {StandService} from '../../stand/service/stand.service';
import {ISalon} from '../../salon/model/salon.interface';
import {SalonService} from '../../salon/service/salon.service';
import {IExhibitor, selectFilterExhibitor} from '../../exhibitor/model/exhibitor.interface';
import {ExhibitorService, formatterExhibitor} from '../../exhibitor/service/exhibitor.service';
import {formatterStatus, Status} from '../../enumerations/status.model';
import {DeleteDialogComponent} from '../../../shared/delete-dialog/delete-dialog.component';
import {ErrorModel} from '../../../shared/field-error/error.model';
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
import {IWorkshop} from "../../workshop/model/workshop.interface";
import {WorkshopService} from "../../workshop/service/workshop.service";
import {formatterModePaymentMeals, ModePaymentMeals} from "../../enumerations/mode-payment-meals.model";
import {formatterInvoiceMethod, InvoiceSendingMethod} from "../../enumerations/invoice-sending-method.model";
import {AlertErrorComponent} from "../../../shared/alert/alert-error.component";
import {AlertComponent} from "../../../shared/alert/alert.component";
import {ProgressSpinner} from "primeng/progressspinner";

@Component({
    selector: 'jhi-participation-update',
    templateUrl: './participation-update.component.html',
    imports: [SharedModule, RouterModule, FormsModule, ReactiveFormsModule, ColorStatusPipe, StatusPipe,
        ButtonBoxComponent, LinkBoxComponent, SelectBoxComponent, DateBoxComponent,
        NumberBoxComponent, TextBoxComponent, TextareaBoxComponent, CheckboxBoxComponent, AlertErrorComponent, AlertComponent, ProgressSpinner]
})
export class ParticipationUpdateComponent implements OnInit {
    protected participationService = inject(ParticipationService);
    protected participationFormService = inject(ParticipationFormService);
    protected conferenceService = inject(ConferenceService);
    protected standService = inject(StandService);
    protected workshopService = inject(WorkshopService);
    protected exhibitorService = inject(ExhibitorService);
    protected salonService = inject(SalonService);
    protected activatedRoute = inject(ActivatedRoute);
    protected modalService = inject(NgbModal);
    protected actionsService = inject(ActionsService);

    isLoading = false;
    isReadOnly = false;

    initialParticipation: IParticipation | null = null;
    statusValues = Object.keys(Status);
    modePaymentMealsValues = Object.keys(ModePaymentMeals);
    invoiceSendingMethodValues = Object.keys(InvoiceSendingMethod);
    conferences$: Observable<IConference[]> | undefined;
    workshops$: Observable<IWorkshop[]> | undefined;
    stands$: Observable<IStand[]> | undefined;
    params!: ParamMap;
    exhibitorsOptions: IExhibitor[] = [];
    editForm: FormGroup<ParticipationFormGroup> = this.participationFormService.createParticipationFormGroup(null);
    availableActions: Observable<AvailableAction[]> = of([]);

    ngOnInit(): void {
        combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data])
            .pipe(
                map(([params, data]) => ({
                    params,
                    isReadOnly: data['readonly'],
                    initialParticipation: data['participation'] as IParticipation,
                })),
            )
            .subscribe(({params, isReadOnly, initialParticipation}) => {
                this.workReload(isReadOnly, params, initialParticipation);
            });
    }

    private workReload(isReadOnly: boolean, params: any, participation: IParticipation) {
        this.isReadOnly = isReadOnly;
        this.initialParticipation = participation ? { ...participation } : null;
        this.params = params;

        this.editForm = this.participationFormService.createParticipationFormGroup(participation);
        this.loadRelationshipsOptions(participation);

        if (participation) {
            this.availableActions = this.actionsService.getAvailableActions('participation', participation.id);
        }

        isReadOnly ? this.activateReadOnlyMode(false) : this.activateEditMode();
    }

    loadStandsOnce(): Observable<IStand[]> {
        if (!this.initialParticipation?.id) {
            return of([]);
        }
        if (!this.stands$) {
            const queryObject = { idParticipation: this.initialParticipation.id };
            this.stands$ = this.standService.query(queryObject).pipe(
                map(res => res ?? []),
                catchError(() => of([])),
                shareReplay(1),
            );
        }
        return this.stands$;
    }

    loadConferencesOnce(): Observable<IConference[]> {
        if (!this.initialParticipation?.id) {
            return of([]);
        }
        if (!this.conferences$) {
            const queryObject = { idParticipation: this.initialParticipation.id };
            this.conferences$ = this.conferenceService.query(queryObject).pipe(
                map(res => res ?? []),
                catchError(() => of([])),
                shareReplay(1),
            );
        }
        return this.conferences$;
    }

    loadWorkshopsOnce(): Observable<IWorkshop[]> {
        if (!this.initialParticipation?.id) {
            return of([]);
        }
        if (!this.workshops$) {
            const queryObject = { idParticipation: this.initialParticipation.id };
            this.workshops$ = this.workshopService.query(queryObject).pipe(
                map(res => res ?? []),
                catchError(() => of([])),
                shareReplay(1),
            );
        }
        return this.workshops$;
    }

    private reload(idParticipation: string): void {
        this.participationService.find(idParticipation).subscribe(participation => {
            this.workReload(this.isReadOnly, this.params, participation.body!);
        });
    }

    activateReadOnlyMode(reset: boolean = true): void {
        this.isReadOnly = true;
        if (reset && this.initialParticipation) {
            this.editForm = this.participationFormService.createParticipationFormGroup(this.initialParticipation);
        }
        this.editForm.disable();
    }

    activateEditMode(): void {
        this.isReadOnly = false;
        this.editForm.enable();
    }


    previousState(): void {
        window.history.back();
    }

    save(): void {
        if (this.isReadOnly) {
            return;
        }
        if (this.editForm.invalid) {
            this.editForm.markAllAsTouched();
            return;
        }
        this.isLoading = true;

        const participation = this.participationFormService.getParticipation(this.editForm);

        const saveOperation = participation.id != null
            ? this.participationService.update(participation)
            : this.participationService.create(participation);

        saveOperation.pipe(finalize(() => (this.isLoading = false)))
            .subscribe((participation) => {
                this.isReadOnly = true;
                this.reload(participation.body!.id);
            });
    }

    deleteEntity(entity: IConference | IStand | IWorkshop, type: 'conference' | 'stand' | 'workshop'): void {
        const modalRef = this.modalService.open(DeleteDialogComponent, {size: 'lg', backdrop: 'static'});

        modalRef.componentInstance.translateKey = `${type}.delete.question`;

        modalRef.componentInstance.translateValues = type === 'conference' ? {title: (entity as IConference).title} : type === 'stand' ?
            {description: getFormattedParticipationName((entity as IStand).participation)} : {title: (entity as IWorkshop).title};

        modalRef.closed
            .pipe(
                filter(reason => reason === ITEM_DELETED_EVENT),
                switchMap(
                    () => type === 'conference' ? this.conferenceService.delete(entity.id) : type === 'stand' ? this.standService.delete(entity.id) : this.workshopService.delete(entity.id)),
            )
            .subscribe(() => this.reload(this.initialParticipation!.id!));
    }

    protected loadRelationshipsOptions(participation: IParticipation): void {
        this.exhibitorService
            .query()
            .pipe(map((res: HttpResponse<IExhibitor[]>) => res.body ?? []))
            .pipe(
                map((exhibitors: IExhibitor[]) =>
                    this.exhibitorService.addExhibitorOptionsIfMissing<IExhibitor>(exhibitors,
                        participation?.exhibitor),
                ),
            )
            .subscribe((exhibitors: IExhibitor[]) => (this.exhibitorsOptions = exhibitors));

        this.salonService
            .find(this.params.get('idSalon')!)
            .pipe(map((res: HttpResponse<ISalon>) => {
                    const salon = res.body ?? null;
                    this.editForm.controls.salon.setValue(salon ?? null);
                })
            ).subscribe();
    }

    clickAction(action: AvailableAction): void {
        if (action.type === 'EMAIL') {
            this.openEmailPopup(action, this.initialParticipation!.id);
        } else if (action.type === 'DOWNLOAD') {
            this.isLoading = true;
            this.actionsService.downloadAction(action.contextCode, this.initialParticipation!.id)
                .pipe(finalize(() => this.isLoading = false)).subscribe(blob => {
                const url = window.URL.createObjectURL(new Blob([blob], {type: 'application/pdf'}));
                window.open(url);

                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                }, 5000);
            });
        } else if (action.type === 'BUSINESS') {
            this.isLoading = true;
            this.actionsService.businessAction(action.contextCode, this.initialParticipation!.id)
                .pipe(finalize(() => this.isLoading = false)).subscribe(() => {
                this.reload(this.initialParticipation!.id!);
            });
        } else {
            console.warn('Action type unknown : ' + action.type);
        }
    }

    openEmailPopup(action: AvailableAction, id: string) {
        this.actionsService.templateEmailAction(action.contextCode, id).subscribe(template => {
            const modalRef = this.modalService.open(EmailDialogComponent, {size: 'xl'});
            modalRef.componentInstance.template = template;
            modalRef.componentInstance.context = action.contextCode;
            modalRef.componentInstance.entityId = id;

            modalRef.result.then((result: EmailMessage) => {
                if (result) {
                    this.isLoading = true;
                    this.actionsService.emailAction(action.contextCode, id, result)
                        .pipe(finalize(() => this.isLoading = false)).subscribe(() => {
                        this.reload(this.initialParticipation!.id!);
                    });
                }
            }).catch(() => {
            });
        });
    }

    openHistoryModal(): void {
        this.participationService.getEventLogs(this.initialParticipation!.id).subscribe(events => {
            const modalRef = this.modalService.open(EventModalComponent, {size: 'lg'});
            modalRef.componentInstance.events = events.body ?? [];
        });
    }

    protected readonly ErrorModel = ErrorModel;
    protected readonly getFormattedParticipationName = getFormattedParticipationName;
    protected readonly formatterStatus = formatterStatus;
    protected readonly formatterExhibitor = formatterExhibitor;
    protected readonly formatterModePaymentMeals = formatterModePaymentMeals;
    protected readonly formatterInvoiceMethod = formatterInvoiceMethod;
    protected readonly selectFilterExhibitor = selectFilterExhibitor;
}
