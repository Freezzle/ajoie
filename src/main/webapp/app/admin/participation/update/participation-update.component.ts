import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {HttpResponse} from '@angular/common/http';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {filter, Observable, of, switchMap} from 'rxjs';
import {finalize, map, shareReplay} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';

import {ParticipationService} from '../service/participation.service';
import {getFormattedParticipationName, IParticipation} from '../model/participation.interface';
import {ParticipationFormGroup, ParticipationFormService} from '../service/participation-form.service';
import {ConferenceService} from '../../conference/service/conference.service';
import {IStand} from '../../stand/model/stand.interface';
import {StandService} from '../../stand/service/stand.service';
import {ISalon} from '../../salon/model/salon.interface';
import {SalonService} from '../../salon/service/salon.service';
import {IExhibitor, selectFilterExhibitor, getExhibitorFullName} from '../../exhibitor/model/exhibitor.interface';
import {ExhibitorService, formatterExhibitor} from '../../exhibitor/service/exhibitor.service';
import {formatterStatus, Status} from '../../enumerations/status.model';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {SelectBoxComponent} from '../../../shared/components/select-box/select-box.component';
import {DateBoxComponent} from '../../../shared/components/date-box/date-box.component';
import {NumberBoxComponent} from '../../../shared/components/number-box/number-box.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {CheckboxBoxComponent} from '../../../shared/components/checkbox-box/checkbox-box.component';
import {IConference} from '../../conference/model/conference.interface';
import {ActionsService} from '../../common/actions.service';
import {AvailableAction, refreshScopeOf} from '../../../shared/model/available-action';
import {EmailDialogComponent} from '../../../shared/email-dialog/email-dialog.component';
import {EmailMessage} from '../../../shared/email-dialog/email-message';
import {EventModalComponent} from '../../../shared/event-modal/event-modal.component';
import {ActionFormDialogComponent} from '../../../shared/action-form-dialog/action-form-dialog.component';
import {IWorkshop} from '../../workshop/model/workshop.interface';
import {WorkshopService} from '../../workshop/service/workshop.service';
import {formatterModePaymentMeals, ModePaymentMeals} from '../../enumerations/mode-payment-meals.model';
import {formatterInvoiceMethod, InvoiceSendingMethod} from '../../enumerations/invoice-sending-method.model';
import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';

import {ConfirmDialogService} from '../../../shared/delete-dialog/confirm-dialog.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmPopup} from 'primeng/confirmpopup';

import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {Badge} from 'primeng/badge';
import {CardComponent} from '../../../shared/components/card/card.component';
import {CardFooterContentDirective} from '../../../shared/components/card/card-footer.directive';
import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {FieldListComponent} from '../../../shared/components/field-list/field-list.component';
import {FieldRowComponent} from '../../../shared/components/field-list/field-row.component';
import {YesNoIconComponent} from '../../../shared/components/yes-no-icon/yes-no-icon.component';
import {StatusTimelineComponent, StatusTimelineActionRequest} from '../../../shared/components/status-timeline/status-timeline.component';
import {TranslateService} from '@ngx-translate/core';
import {NavigationStateService} from '../../../layouts/navbar/navigation-state.service';
import {RatingBoxComponent} from '../../../shared/rating-box/rating-box.component';
import {Rating} from 'primeng/rating';
import {categoryColor, EntityAction, EntityFootItemComponent, EntityRowComponent, EntityStatusComponent, statusColor} from '../../../shared/components/entity-list';
import {Category, formatterCategory} from '../../enumerations/category.model';
import {DetailPageLayoutComponent} from '../../../shared/components/detail-page-layout/detail-page-layout.component';
import {
    DetailCreateActionsDirective,
    DetailMainDirective,
    DetailSideDirective,
    DetailStatusDirective
} from '../../../shared/components/detail-page-layout/detail-page-layout-slots.directive';
import {ExhibitorDuplicateCompareComponent} from '../duplicate/exhibitor-duplicate-compare.component';

const SECTION_CONTROLS: Record<string, string[]> = {
    registration: ['therapistName', 'registrationDate', 'acceptedChart', 'acceptedContract'],
    billing: ['nbMeal1', 'nbMeal2', 'nbMeal3', 'modePaymentMeals', 'invoiceSendingMethod', 'needArrangement'],
    offer: ['hasOffer', 'offer', 'additionnalInformation'],
    rating: ['crushOfHeart', 'guestOfHonor', 'ratingFriendliness', 'ratingPaymentSpeed', 'ratingServiceQuality', 'extraInformation']
};

@Component({
               selector: 'app-participation-update',
               templateUrl: './participation-update.component.html',
               styleUrl: './participation-update.component.scss',
               imports: [SharedModule, RouterModule, FormsModule, ReactiveFormsModule,
                         ButtonBoxComponent, SelectBoxComponent, DateBoxComponent,
                         NumberBoxComponent, TextBoxComponent, TextareaBoxComponent, CheckboxBoxComponent,
                         AlertErrorComponent, ConfirmPopup, Tab, TabList, Tabs, TabPanels, TabPanel, Badge,
                         CardComponent, CardFooterContentDirective, ContentPageComponent, FieldListComponent,
                         FieldRowComponent, StatusTimelineComponent, RatingBoxComponent, Rating,
                         EntityRowComponent, EntityStatusComponent, EntityFootItemComponent, YesNoIconComponent,
                         DetailPageLayoutComponent, DetailStatusDirective, DetailMainDirective,
                         DetailSideDirective, DetailCreateActionsDirective]
           })
export class ParticipationUpdateComponent implements OnInit {
    tabActive = '0';
    isLoading = false;
    eventId!: string;
    initialParticipation: IParticipation | null = null;
    modePaymentMealsValues = Object.keys(ModePaymentMeals);
    invoiceSendingMethodValues = Object.keys(InvoiceSendingMethod);
    exhibitorsOptions: IExhibitor[] = [];
    conferences$: Observable<IConference[]> | undefined;
    workshops$: Observable<IWorkshop[]> | undefined;
    stands$: Observable<IStand[]> | undefined;

    readonly activeSection = signal<string | null>(null);
    readonly availableActions = signal<AvailableAction[]>([]);
    private sectionSnapshot: Record<string, unknown> = {};

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
    protected readonly getExhibitorFullName = getExhibitorFullName;
    protected readonly statusColor = statusColor;
    protected readonly categoryColor = categoryColor;
    protected readonly formatterCategory = formatterCategory;
    protected readonly Category = Category;
    protected readonly Status = Status;
    readonly subtitle = computed(() => this.stateService.currentSalonPlace(this.eventId));

    private readonly standActionsCache = new Map<string, EntityAction[]>();
    private readonly conferenceActionsCache = new Map<string, EntityAction[]>();
    private readonly workshopActionsCache = new Map<string, EntityAction[]>();

    readonly registrationActions = computed<EntityAction[]>(() => this.sectionAction('registration'));
    readonly offerActions = computed<EntityAction[]>(() => this.sectionAction('offer'));
    readonly ratingActions = computed<EntityAction[]>(() => this.sectionAction('rating'));

    readonly billingActions = computed<EntityAction[]>(() => {
        const actions: EntityAction[] = [];
        if (!this.isCreating && !this.activeSection()) {
            actions.push({labelKey: 'common.edit', icon: 'pi pi-pencil', run: () => this.beginSection('billing')});
        }
        if (!this.isCreating) {
            actions.push({
                             labelKey: 'participation.billing.title',
                             icon: 'pi pi-file',
                             run: () => { void this.router.navigate(['../invoicing-plans'], {relativeTo: this.activatedRoute}); }
                         });
        }
        return actions;
    });

    get isCreating(): boolean {
        return !this.editForm.controls.id.value;
    }

    ngOnInit(): void {
        const data = this.activatedRoute.snapshot.data;
        this.eventId = this.activatedRoute.snapshot.paramMap.get('idSalon')!;

        this.initialParticipation = data['participation'] ? {...data['participation']} : null;
        this.editForm = this.participationFormService.createParticipationFormGroup(this.initialParticipation);

        if (this.isCreating) {
            this.editForm.enable();
        } else {
            this.editForm.disable();
            this.loadStatusActions(this.initialParticipation?.id);
        }

        this.loadRelationshipsOptions();
    }

    private sectionAction(section: string): EntityAction[] {
        if (this.isCreating || this.activeSection()) {
            return [];
        }
        return [{labelKey: 'common.edit', icon: 'pi pi-pencil', run: () => this.beginSection(section)}];
    }

    beginSection(section: string): void {
        if (!this.initialParticipation?.id || this.activeSection()) {
            return;
        }
        this.activeSection.set(section);
        this.sectionSnapshot = this.snapshot(section);
        SECTION_CONTROLS[section].forEach(name => this.editForm.get(name)?.enable());
    }

    cancelSection(section: string): void {
        Object.entries(this.sectionSnapshot).forEach(([name, value]) => {
            this.editForm.get(name)?.setValue(value);
        });
        this.resetSectionControls(section);
        this.activeSection.set(null);
    }

    saveSection(section: string): void {
        const names = SECTION_CONTROLS[section];
        const invalid = names.some(name => this.editForm.get(name)?.invalid);
        if (invalid) {
            names.forEach(name => this.editForm.get(name)?.markAsTouched());
            return;
        }

        this.isLoading = true;
        const participation = this.participationFormService.getParticipation(this.editForm);
        this.participationService.patch(this.initialParticipation!.id, participation)
            .pipe(finalize(() => (this.isLoading = false)))
            .subscribe(() => this.reloadParticipation(this.initialParticipation!.id));
    }

    previousState(): void {
        window.history.back();
    }

    save(): void {
        if (this.editForm.invalid) {
            this.editForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        const participation = this.participationFormService.getParticipation(this.editForm);
        this.participationService.create(participation)
            .pipe(finalize(() => (this.isLoading = false)))
            .subscribe(part => {
                this.router.navigate(['../', part.body?.id, 'view'], {
                    relativeTo: this.activatedRoute,
                    replaceUrl: true
                });
            });
    }

    loadStandsOnce(): Observable<IStand[]> {
        if (!this.initialParticipation?.id) {
            return of([]);
        }
        this.stands$ ??= this.standService.query({idParticipation: this.initialParticipation.id}).pipe(
            map(res => res ?? []),
            shareReplay(1)
        );
        return this.stands$;
    }

    loadConferencesOnce(): Observable<IConference[]> {
        if (!this.initialParticipation?.id) {
            return of([]);
        }
        this.conferences$ ??= this.conferenceService.query({idParticipation: this.initialParticipation.id}).pipe(
            map(res => res ?? []),
            shareReplay(1)
        );
        return this.conferences$;
    }

    loadWorkshopsOnce(): Observable<IWorkshop[]> {
        if (!this.initialParticipation?.id) {
            return of([]);
        }
        this.workshops$ ??= this.workshopService.query({idParticipation: this.initialParticipation.id}).pipe(
            map(res => res ?? []),
            shareReplay(1)
        );
        return this.workshops$;
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
            .subscribe(() => this.reloadParticipation(participationId));
    }

    standActions(stand: IStand): EntityAction[] {
        return this.cachedActions(this.standActionsCache, stand.id,
                                  () => this.deleteAction(target => this.deleteEntity(target, stand, 'stand')));
    }

    conferenceActions(conference: IConference): EntityAction[] {
        return this.cachedActions(this.conferenceActionsCache, conference.id,
                                  () => this.deleteAction(target => this.deleteEntity(target, conference, 'conference')));
    }

    workshopActions(workshop: IWorkshop): EntityAction[] {
        return this.cachedActions(this.workshopActionsCache, workshop.id,
                                  () => this.deleteAction(target => this.deleteEntity(target, workshop, 'workshop')));
    }

    statusLabelKey(type: 'conference' | 'stand' | 'workshop', status: Status): string {
        return `${type}.list.status.${status}`;
    }

    participationStatusLabelKey(status: string | null | undefined): string | null {
        return status ? `participation.list.status.${status}` : null;
    }

    private cachedActions(cache: Map<string, EntityAction[]>, id: string, build: () => EntityAction[]): EntityAction[] {
        let actions = cache.get(id);
        if (!actions) {
            actions = build();
            cache.set(id, actions);
        }
        return actions;
    }

    private deleteAction(run: (target: HTMLElement) => void): EntityAction[] {
        return [
            {
                labelKey: 'entityList.action.delete',
                icon: 'pi pi-trash',
                danger: true,
                run
            }
        ];
    }

    onStatusAction(request: StatusTimelineActionRequest): void {
        const participationId = this.initialParticipation?.id;
        if (!participationId) {
            return;
        }

        const action = request.action;
        if (action.contextCode === 'participation-resolve-duplicate') {
            this.openDuplicateResolver(action, participationId);
        } else if (action.type === 'EMAIL') {
            this.openEmailPopup(action, participationId);
        } else if (action.type === 'DOWNLOAD') {
            this.downloadAction(action, participationId);
        } else if (action.requiredFields && action.requiredFields.length > 0) {
            const modalRef = this.modalService.open(ActionFormDialogComponent, {size: 'lg'});
            modalRef.componentInstance.requiredFields = action.requiredFields;
            modalRef.componentInstance.actionLabelKey = action.labelKey;

            modalRef.result.then((payload: Map<string, any>) => {
                if (payload) {
                    this.executeBusinessAction(action, participationId, payload);
                }
            }).catch(() => {
                // Modal dismissed
            });
        } else {
            this.executeBusinessAction(action, participationId);
        }
    }

    private openDuplicateResolver(action: AvailableAction, participationId: string): void {
        const duplicateExhibitor = this.initialParticipation?.exhibitor;
        if (!duplicateExhibitor) {
            return;
        }

        const modalRef = this.modalService.open(ExhibitorDuplicateCompareComponent, {size: 'xl'});
        modalRef.componentInstance.participationId = participationId;
        modalRef.componentInstance.duplicateExhibitor = duplicateExhibitor;

        modalRef.result.then((payload: Map<string, any>) => {
            if (payload) {
                this.executeBusinessAction(action, participationId, payload);
            }
        }).catch(() => {
            // Modal dismissed
        });
    }

    private downloadAction(action: AvailableAction, participationId: string): void {
        this.isLoading = true;
        this.actionsService.downloadAction(action.contextCode, participationId)
            .pipe(finalize(() => this.isLoading = false)).subscribe(res => {
            const cd = res.headers.get('content-disposition') ?? '';
            const filename = this.getFilenameFromContentDisposition(cd) ?? 'document.pdf';

            const blob = res.body!;
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();

            window.URL.revokeObjectURL(url);
        });
    }

    private executeBusinessAction(action: AvailableAction, participationId: string, payload?: Map<string, any>): void {
        this.isLoading = true;
        const reload = refreshScopeOf(action) !== 'NONE';

        this.actionsService.businessAction(action.contextCode, participationId, payload)
            .pipe(
                finalize(() => this.isLoading = false),
                switchMap(() => reload
                                ? this.participationService.find(participationId)
                                : of(null)))
            .subscribe(participation => {
                if (participation) {
                    this.reloadParticipation(participationId);
                }
            });
    }

    openEmailPopup(action: AvailableAction, id: string): void {
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
                        .subscribe(() => this.reloadParticipation(participationId));
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

    protected loadRelationshipsOptions(): void {
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

    private reloadParticipation(id: string): void {
        this.stands$ = undefined;
        this.conferences$ = undefined;
        this.workshops$ = undefined;
        this.standActionsCache.clear();
        this.conferenceActionsCache.clear();
        this.workshopActionsCache.clear();

        this.participationService.find(id).subscribe(response => {
            this.initialParticipation = response.body ? {...response.body} : null;
            this.editForm = this.participationFormService.createParticipationFormGroup(this.initialParticipation);
            this.editForm.disable();
            this.activeSection.set(null);
            this.loadRelationshipsOptions();
            this.loadStatusActions(this.initialParticipation?.id);
        });
    }

    private loadStatusActions(id: string | undefined): void {
        if (!id) {
            return;
        }
        this.actionsService.getAvailableActions('participation', id).subscribe(actions => this.availableActions.set(actions));
    }

    private snapshot(section: string): Record<string, unknown> {
        return Object.fromEntries(SECTION_CONTROLS[section].map(name => [name, this.editForm.get(name)?.value]));
    }

    private resetSectionControls(section: string): void {
        SECTION_CONTROLS[section].forEach(name => this.editForm.get(name)?.disable());
    }

    private getFilenameFromContentDisposition(cd: string): string | null {
        const utf8 = cd.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
        if (utf8?.[1]) {
            return decodeURIComponent(utf8[1]);
        }

        const ascii = cd.match(/filename\s*=\s*"([^"]+)"/i) ?? cd.match(/filename\s*=\s*([^;]+)/i);
        return ascii?.[1]?.trim() ?? null;
    }
}
