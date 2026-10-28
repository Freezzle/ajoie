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
import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {MenuBoxComponent} from '../../../shared/components/menu-box/menu-box.component';
import {TranslateService} from '@ngx-translate/core';
import {NavigationStateService} from '../../../layouts/navbar/navigation-state.service';
import {RatingBoxComponent} from '../../../shared/rating-box/rating-box.component';
import {AppMenuItem} from '../../../shared/utils/app-menu-item.model';
import {MenuItemBuilderService} from '../../../shared/utils/menu-item-builder.service';
import {categoryColor, EntityAction, EntityFootItemComponent, EntityRowComponent, EntityStatusComponent, statusColor} from '../../../shared/components/entity-list';
import {Category, formatterCategory} from '../../enumerations/category.model';

@Component({
               selector: 'app-participation-update',
               templateUrl: './participation-update.component.html',
               imports: [SharedModule, RouterModule, FormsModule, ReactiveFormsModule,
                         ButtonBoxComponent, LinkBoxComponent, SelectBoxComponent, DateBoxComponent,
                         NumberBoxComponent, TextBoxComponent, TextareaBoxComponent, CheckboxBoxComponent, AlertErrorComponent,  ConfirmPopup,  Tab, TabList, Tabs, TabPanels, TabPanel, Badge, CardComponent, ContentPageComponent, MenuBoxComponent, RatingBoxComponent, EntityRowComponent, EntityStatusComponent, EntityFootItemComponent]
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
    menuCache: AppMenuItem[] = [];
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
    protected menuItemBuilderService = inject(MenuItemBuilderService);
    protected router = inject(Router);
    protected readonly formatterStatus = formatterStatus;
    protected readonly formatterExhibitor = formatterExhibitor;
    protected readonly formatterModePaymentMeals = formatterModePaymentMeals;
    protected readonly formatterInvoiceMethod = formatterInvoiceMethod;
    protected readonly selectFilterExhibitor = selectFilterExhibitor;
    protected readonly statusColor = statusColor;
    protected readonly categoryColor = categoryColor;
    protected readonly formatterCategory = formatterCategory;
    protected readonly Category = Category;
    protected readonly Status = Status;

    /**
     * Les actions d'une ligne sont mémoïsées par identifiant : le composant est en
     * détection de changement par défaut, et recréer un tableau à chaque cycle
     * reconstruirait le menu sous le curseur (obligeant à cliquer deux fois).
     */
    private readonly standActionsCache = new Map<string, EntityAction[]>();
    private readonly conferenceActionsCache = new Map<string, EntityAction[]>();
    private readonly workshopActionsCache = new Map<string, EntityAction[]>();

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

    clickAction(action: AvailableAction, htmlElement?: HTMLElement): void {
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
                a.download = filename;
                a.click();

                window.URL.revokeObjectURL(url);
            });
        } else if (action.type === 'BUSINESS') {
            this.handleBusinessAction(action, participationId, htmlElement);
        } else {
            console.warn('Action type unknown : ' + action.type);
        }
    }

    private handleBusinessAction(action: AvailableAction, participationId: string, htmlElement?: HTMLElement): void {
        // Si des champs sont requis, ouvrir la modale de formulaire
        if (action.requiredFields && action.requiredFields.length > 0) {
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
            const targetElement = htmlElement || document.activeElement as HTMLElement;

            const confirmMessageKey = action.confirmationKey || 'common.confirmAction.default';

            this.confirmDialogService.confirmAction(targetElement, confirmMessageKey, {
                actionLabel: this.translateService.instant(action.labelKey)
            })
                .pipe(filter(confirmed => confirmed))
                .subscribe(() => {
                    this.executeBusinessAction(action, participationId);
                });
        }
    }

    private executeBusinessAction(action: AvailableAction, participationId: string, payload?: Map<string, any>): void {
        this.isLoading = true;
        // Une action sans effet sur la participation (téléchargement) n'impose pas de la relire.
        const reload = refreshScopeOf(action) !== 'NONE';

        this.actionsService.businessAction(action.contextCode, participationId, payload)
            .pipe(
                finalize(() => this.isLoading = false),
                switchMap(() => reload
                                ? this.participationService.find(participationId)
                                : of(null)))
            .subscribe(participation => {
                if (participation) {
                    this.load(participation.body, this.isReadOnly);
                }
            });
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

    buildInvoicingPlanMenuItems(availableActions: AvailableAction[]): AppMenuItem[] {
        return this.menuItemBuilderService.buildMenuItemsFromActions(
            availableActions,
            (action, htmlElement) => this.clickAction(action, htmlElement)
        );
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
        this.standActionsCache.clear();
        this.conferenceActionsCache.clear();
        this.workshopActionsCache.clear();

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
