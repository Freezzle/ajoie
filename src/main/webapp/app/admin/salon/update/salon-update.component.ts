import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {finalize, filter} from 'rxjs/operators';
import SharedModule from 'app/shared/shared.module';
import {FormArray, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ISalon} from '../model/salon.interface';
import {SalonService} from '../service/salon.service';
import {PriceStandGroup, SalonFormGroup, SalonFormService} from '../service/salon-form.service';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {EditorBoxComponent} from '../../../shared/components/editor-box/editor-box.component';
import {DateBoxComponent} from '../../../shared/components/date-box/date-box.component';
import {sortPriceStandSalon} from '../model/price-stand-salon.interface';
import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';
import {CurrencyBoxComponent} from '../../../shared/components/currency-box/currency-box.component';
import {NumberBoxComponent} from '../../../shared/components/number-box/number-box.component';
import {TableModule} from 'primeng/table';
import {ConfirmPopup} from 'primeng/confirmpopup';
import {ToggleSwitch} from 'primeng/toggleswitch';
import {CardComponent} from '../../../shared/components/card/card.component';
import {CardFooterContentDirective} from '../../../shared/components/card/card-footer.directive';
import {CheckboxBoxComponent} from '../../../shared/components/checkbox-box/checkbox-box.component';
import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {AddressFormComponent} from '../../../shared/components/address-form/address-form.component';
import {BankAccountFormComponent} from '../../../shared/components/bank-account-form/bank-account-form.component';
import {MenuBoxComponent} from '../../../shared/components/menu-box/menu-box.component';
import {FieldListComponent} from '../../../shared/components/field-list/field-list.component';
import {FieldRowComponent} from '../../../shared/components/field-list/field-row.component';
import {YesNoIconComponent} from '../../../shared/components/yes-no-icon/yes-no-icon.component';
import RichTextPipe from '../../../shared/pipe/rich-text.pipe';
import {AppMenuItem} from '../../../shared/utils/app-menu-item.model';
import {MenuItemBuilderService} from '../../../shared/utils/menu-item-builder.service';
import {ActionsService} from '../../common/actions.service';
import {AvailableAction} from '../../../shared/model/available-action';
import {EntityAction} from '../../../shared/components/entity-list/entity-list.model';
import {TranslateService} from '@ngx-translate/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ActionFormDialogComponent} from '../../../shared/action-form-dialog/action-form-dialog.component';
import {EmailDialogComponent} from '../../../shared/email-dialog/email-dialog.component';
import {EmailMessage} from '../../../shared/email-dialog/email-message';
import {ConfirmDialogService} from '../../../shared/delete-dialog/confirm-dialog.service';
import {AlertService} from '../../../core/util/alert.service';
import {NavigationStateService} from '../../../layouts/navbar/navigation-state.service';
import {IAddress} from '../../common/address.model';
import {InvoicingPlanService} from '../../invoicing-plan/service/invoicing-plan.service';
import {DetailPageLayoutComponent} from '../../../shared/components/detail-page-layout/detail-page-layout.component';
import {
    DetailCreateActionsDirective,
    DetailMainDirective,
    DetailSideDirective
} from '../../../shared/components/detail-page-layout/detail-page-layout-slots.directive';

const SECTION_CONTROLS: Record<string, string[]> = {
    general: ['place', 'startingDate', 'endingDate', 'extraInformation'],
    billing: ['referenceNumber', 'bankAccount'],
    prices: ['priceConference', 'priceWorkshop', 'priceSharingStand', 'priceMeal1', 'priceMeal2', 'priceMeal3'],
    dimensions: ['priceStandSalons'],
    exhibitorRegistration: ['registrationEnabled', 'registrationOpeningDate', 'registrationClosingDate',
                            'registrationWelcomeTitle', 'registrationWelcomeText', 'registrationChartText',
                            'registrationSalonChartText'],
    volunteerRegistration: ['volunteerRegistrationEnabled', 'volunteerRegistrationOpeningDate',
                            'volunteerRegistrationClosingDate', 'volunteerRegistrationWelcomeTitle',
                            'volunteerRegistrationWelcomeText'],
    headquartersAddress: ['headquartersAddress'],
    eventAddress: ['eventAddress']
};

@Component({
               selector: 'app-salon-update',
               templateUrl: './salon-update.component.html',
               styleUrl: './salon-update.component.scss',
               imports: [
                   SharedModule,
                   RouterModule,
                   FormsModule,
                   ReactiveFormsModule,
                   ButtonBoxComponent,
                   TextBoxComponent,
                   TextareaBoxComponent,
                   EditorBoxComponent,
                   DateBoxComponent,
                   AlertErrorComponent,
                   CurrencyBoxComponent,
                   NumberBoxComponent,
                   TableModule,
                   ConfirmPopup,
                   CardComponent,
                   CardFooterContentDirective,
                   CheckboxBoxComponent,
                   ContentPageComponent,
                   AddressFormComponent,
                   BankAccountFormComponent,
                   MenuBoxComponent,
                   FieldListComponent,
                   FieldRowComponent,
                   YesNoIconComponent,
                   RichTextPipe,
                   DetailPageLayoutComponent,
                   DetailMainDirective,
                   DetailSideDirective,
                   DetailCreateActionsDirective,
                   ToggleSwitch
               ]
           })
export class SalonUpdateComponent implements OnInit {
    isLoading = false;
    initialSalon: ISalon | null = null;
    menuCache: AppMenuItem[] = [];

    readonly activeSection = signal<string | null>(null);
    private sectionSnapshot: Record<string, unknown> = {};
    /** Vrai si au moins une facture existe pour ce salon : verrouille le N° de référence. */
    readonly hasInvoices = signal(false);
    readonly expandedRichText = signal<Record<string, boolean>>({});

    protected salonService = inject(SalonService);
    protected salonFormService = inject(SalonFormService);
    editForm: FormGroup<SalonFormGroup> = this.salonFormService.createSalonFormGroup(null);
    protected activatedRoute = inject(ActivatedRoute);
    private readonly actionsService = inject(ActionsService);
    private readonly menuItemBuilderService = inject(MenuItemBuilderService);
    private readonly translateService = inject(TranslateService);
    private readonly modalService = inject(NgbModal);
    private readonly confirmDialogService = inject(ConfirmDialogService);
    private readonly alertService = inject(AlertService);
    private readonly navigationStateService = inject(NavigationStateService);
    private readonly invoicingPlanService = inject(InvoicingPlanService);
    private readonly idSalon = signal<string | null>(null);
    readonly subtitle = computed(() => this.navigationStateService.currentSalonPlace(this.idSalon()));
    priceStandRows: FormGroup<PriceStandGroup>[] = [];

    readonly generalActions = computed<EntityAction[]>(() => this.sectionAction('general'));
    readonly billingActions = computed<EntityAction[]>(() => this.sectionAction('billing'));
    readonly pricesActions = computed<EntityAction[]>(() => this.sectionAction('prices'));
    readonly dimensionsActions = computed<EntityAction[]>(() => this.sectionAction('dimensions'));
    readonly exhibitorRegistrationActions = computed<EntityAction[]>(() => this.sectionAction('exhibitorRegistration'));
    readonly volunteerRegistrationActions = computed<EntityAction[]>(() => this.sectionAction('volunteerRegistration'));
    readonly headquartersAddressActions = computed<EntityAction[]>(() => this.sectionAction('headquartersAddress'));
    readonly eventAddressActions = computed<EntityAction[]>(() => this.sectionAction('eventAddress'));

    get isCreating(): boolean {
        return !this.editForm.controls.id.value;
    }

    get priceStandSalons(): FormArray<FormGroup<PriceStandGroup>> {
        return this.editForm.controls.priceStandSalons;
    }

    get registrationLink(): string {
        const salonId = this.editForm.controls.id.value;
        return salonId ? `${window.location.origin}/inscription/${salonId}` : '';
    }

    copyRegistrationLink(): void {
        this.copyLink(this.registrationLink);
    }

    get volunteerRegistrationLink(): string {
        const salonId = this.editForm.controls.id.value;
        return salonId ? `${window.location.origin}/benevoles/${salonId}` : '';
    }

    copyVolunteerRegistrationLink(): void {
        this.copyLink(this.volunteerRegistrationLink);
    }

    private copyLink(link: string): void {
        if (!link) {
            return;
        }
        navigator.clipboard.writeText(link).then(
            () => this.alertService.addAlert({type: 'success', translationKey: 'salon.registration.linkCopied'}),
            () => this.alertService.addAlert({type: 'danger', translationKey: 'salon.registration.linkCopyFailed'}));
    }

    ngOnInit(): void {
        this.idSalon.set(this.activatedRoute.snapshot.paramMap.get('idSalon'));
        this.activatedRoute.data.subscribe((data) => {
            this.setupForm(data['salon'] ? {...(data['salon'] as ISalon)} : null);

            if (this.initialSalon?.id) {
                this.loadActions();
                this.loadInvoices(this.initialSalon.id);
            }
        });
    }

    private setupForm(salon: ISalon | null): void {
        this.processSalonData(salon);
        this.editForm = this.salonFormService.createSalonFormGroup(this.initialSalon);
        this.refreshPriceStandRows();
        if (this.isCreating) {
            this.editForm.enable();
        } else {
            this.editForm.disable();
        }
        this.activeSection.set(null);
    }

    private loadInvoices(idSalon: string): void {
        this.invoicingPlanService.queryBySalon(idSalon).subscribe(plans => {
            this.hasInvoices.set((plans ?? []).length > 0);
        });
    }

    /** N° de référence verrouillé après création dès qu'une facture existe. */
    get isReferenceLocked(): boolean {
        return !this.isCreating && this.hasInvoices();
    }

    isRichTextExpanded(fieldName: string): boolean {
        return this.expandedRichText()[fieldName] ?? false;
    }

    toggleRichText(fieldName: string): void {
        this.expandedRichText.update(state => ({...state, [fieldName]: !(state[fieldName] ?? false)}));
    }

    hasExpandableRichText(value: string | null | undefined): boolean {
        if (!value) {
            return false;
        }
        const text = value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
        return text.length > 180;
    }

    private sectionAction(section: string): EntityAction[] {
        if (this.isCreating || this.activeSection()) {
            return [];
        }
        return [{labelKey: 'common.edit', icon: 'pi pi-pencil', run: () => this.beginSection(section)}];
    }

    beginSection(section: string): void {
        if (!this.initialSalon?.id || this.activeSection()) {
            return;
        }
        this.activeSection.set(section);
        this.sectionSnapshot = this.snapshot(section);
        SECTION_CONTROLS[section].forEach(name => this.editForm.get(name)?.enable());
        if (section === 'billing' && this.isReferenceLocked) {
            this.editForm.controls.referenceNumber.disable();
        }
    }

    cancelSection(section: string): void {
        if (section === 'dimensions') {
            this.setupForm(this.initialSalon);
            return;
        }
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
            names.forEach(name => this.editForm.get(name)?.markAllAsTouched());
            return;
        }
        this.isLoading = true;
        const salon = this.salonFormService.getSalon(this.editForm);
        this.salonService.update(salon)
            .pipe(finalize(() => (this.isLoading = false)))
            .subscribe(() => this.reloadSalon(this.initialSalon!.id));
    }

    private reloadSalon(id: string): void {
        this.salonService.find(id).subscribe(response => {
            this.setupForm(response.body ? {...response.body} : null);
            this.loadInvoices(id);
        });
    }

    private snapshot(section: string): Record<string, unknown> {
        return Object.fromEntries(SECTION_CONTROLS[section].map(name => [name, this.editForm.get(name)?.value]));
    }

    private resetSectionControls(section: string): void {
        SECTION_CONTROLS[section].forEach(name => this.editForm.get(name)?.disable());
    }

    loadActions(): void {
        const salonId = this.initialSalon?.id;
        if (!salonId) {
            return;
        }
        this.actionsService.getAvailableActions('salon', salonId, 'salon').subscribe(actions => {
            this.menuCache = this.menuItemBuilderService.buildMenuItemsFromActions(
                actions,
                (action, htmlElement) => this.clickAction(action, htmlElement)
            );
        });
    }

    clickAction(action: AvailableAction, htmlElement?: HTMLElement): void {
        if (action.type === 'BUSINESS') {
            this.handleBusinessAction(action, htmlElement);
        } else if (action.type === 'EMAIL') {
            this.openEmailPopup(action);
        } else {
            console.warn('Action type unknown : ' + action.type);
        }
    }

    openEmailPopup(action: AvailableAction): void {
        const salonId = this.initialSalon?.id;
        if (!salonId) {
            return;
        }
        this.actionsService.templateEmailAction(action.contextCode, salonId).subscribe(template => {
            const modalRef = this.modalService.open(EmailDialogComponent, {size: 'xl'});
            modalRef.componentInstance.template = template;
            modalRef.componentInstance.context = action.contextCode;
            modalRef.componentInstance.entityId = salonId;

            modalRef.result.then((result: EmailMessage) => {
                if (result) {
                    this.isLoading = true;
                    this.actionsService.emailAction(action.contextCode, salonId, result)
                        .pipe(finalize(() => this.isLoading = false))
                        .subscribe(() => this.loadActions());
                }
            }).catch(() => { /* dismissed */ });
        });
    }

    private handleBusinessAction(action: AvailableAction, htmlElement?: HTMLElement): void {
        const salonId = this.initialSalon?.id;
        if (!salonId) {
            return;
        }
        if (action.requiredFields && action.requiredFields.length > 0) {
            const modalRef = this.modalService.open(ActionFormDialogComponent, {size: 'lg'});
            modalRef.componentInstance.requiredFields = action.requiredFields;
            modalRef.componentInstance.actionLabelKey = action.labelKey;
            modalRef.result.then((payload: Map<string, any>) => {
                if (payload) {
                    this.executeBusinessAction(action.contextCode, salonId, payload);
                }
            }).catch(() => { /* dismissed */ });
        } else {
            const targetElement = htmlElement ?? document.activeElement as HTMLElement;
            const confirmMessageKey = action.confirmationKey ?? 'common.confirmAction.default';
            this.confirmDialogService.confirmAction(targetElement, confirmMessageKey, {
                actionLabel: this.translateService.instant(action.labelKey)
            })
                .pipe(filter(confirmed => confirmed))
                .subscribe(() => this.executeBusinessAction(action.contextCode, salonId));
        }
    }

    private executeBusinessAction(context: string, salonId: string, payload?: Map<string, any>): void {
        this.isLoading = true;
        this.actionsService.businessAction(context, salonId, payload)
            .pipe(finalize(() => this.isLoading = false))
            .subscribe(() => {
                this.loadActions();
            });
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
        const salon = this.salonFormService.getSalon(this.editForm);
        const saveOperation = salon.id != null
                              ? this.salonService.update(salon)
                              : this.salonService.create(salon);
        saveOperation.pipe(finalize(() => (this.isLoading = false))).subscribe(() => this.previousState());
    }

    addPriceStand(): void {
        this.editForm.controls['priceStandSalons'].push(this.salonFormService.createPriceStand(null));
        this.refreshPriceStandRows();
    }

    movePriceStand(index: number, offset: -1 | 1): void {
        const target = index + offset;
        const array = this.priceStandSalons;
        if (target < 0 || target >= array.length) {
            return;
        }
        const control = array.at(index);
        array.removeAt(index);
        array.insert(target, control);
        array.markAsDirty();
        this.refreshPriceStandRows();
    }

    removePriceStand(index: number): void {
        this.priceStandSalons.removeAt(index);
        this.priceStandSalons.markAsDirty();
        this.refreshPriceStandRows();
    }

    hasAddress(address: IAddress | null | undefined): boolean {
        return !!(address?.street ?? address?.postalCode ?? address?.city);
    }

    private refreshPriceStandRows(): void {
        this.priceStandRows = [...this.priceStandSalons.controls];
    }

    private processSalonData(salon: ISalon | null): void {
        if (!salon) {
            this.initialSalon = {} as ISalon;
            this.initialSalon.priceStandSalons = [];
            return;
        }
        this.initialSalon = salon;
        sortPriceStandSalon(this.initialSalon.priceStandSalons ?? []);
    }
}
