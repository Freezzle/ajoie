import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {finalize, filter} from 'rxjs/operators';
import SharedModule from 'app/shared/shared.module';
import {FormArray, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ISalon} from '../model/salon.interface';
import {SalonService} from '../service/salon.service';
import {PriceStandGroup, SalonFormGroup, SalonFormService} from '../service/salon-form.service';
import {State} from '../../enumerations/state.model';
import {Status} from '../../enumerations/status.model';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {DateBoxComponent} from '../../../shared/components/date-box/date-box.component';
import {sortPriceStandSalon} from '../model/price-stand-salon.interface';
import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';
import {CurrencyBoxComponent} from '../../../shared/components/currency-box/currency-box.component';
import {NumberBoxComponent} from '../../../shared/components/number-box/number-box.component';
import {TableModule} from 'primeng/table';
import {ConfirmPopup} from 'primeng/confirmpopup';
import {CardComponent} from '../../../shared/components/card/card.component';
import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {AddressFormComponent} from '../../../shared/components/address-form/address-form.component';
import {BankAccountFormComponent} from '../../../shared/components/bank-account-form/bank-account-form.component';
import {MenuBoxComponent} from '../../../shared/components/menu-box/menu-box.component';
import {AppMenuItem} from '../../../shared/utils/app-menu-item.model';
import {MenuItemBuilderService} from '../../../shared/utils/menu-item-builder.service';
import {ActionsService} from '../../common/actions.service';
import {AvailableAction} from '../../../shared/model/available-action';
import {TranslateService} from '@ngx-translate/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ActionFormDialogComponent} from '../../../shared/action-form-dialog/action-form-dialog.component';
import {ConfirmDialogService} from '../../../shared/delete-dialog/confirm-dialog.service';
@Component({
               selector: 'app-salon-update',
               templateUrl: './salon-update.component.html',
               imports: [
                   SharedModule,
                   RouterModule,
                   FormsModule,
                   ReactiveFormsModule,
                   ButtonBoxComponent,
                   TextBoxComponent,
                   TextareaBoxComponent,
                   DateBoxComponent,
                   AlertErrorComponent,
                   CurrencyBoxComponent,
                   NumberBoxComponent,
                   TableModule,
                   ConfirmPopup,
                   CardComponent,
                   ContentPageComponent,
                   AddressFormComponent,
                   BankAccountFormComponent,
                   MenuBoxComponent
               ]
           })
export class SalonUpdateComponent implements OnInit {
    isLoading = false;
    initialSalon: ISalon | null = null;
    isReadOnly = true;
    menuCache: AppMenuItem[] = [];
    sourceSalon: ISalon | null = null;

    protected salonService = inject(SalonService);
    protected salonFormService = inject(SalonFormService);
    editForm: FormGroup<SalonFormGroup> = this.salonFormService.createSalonFormGroup(null);
    protected activatedRoute = inject(ActivatedRoute);
    protected readonly State = State;
    protected readonly Status = Status;
    private readonly actionsService = inject(ActionsService);
    private readonly menuItemBuilderService = inject(MenuItemBuilderService);
    private readonly translateService = inject(TranslateService);
    private readonly modalService = inject(NgbModal);
    private readonly confirmDialogService = inject(ConfirmDialogService);
    get priceStandSalons(): FormArray<FormGroup<PriceStandGroup>> {
        return this.editForm.controls.priceStandSalons;
    }
    ngOnInit(): void {
        this.activateReadOnlyMode(false);
        this.activatedRoute.data
            .subscribe((data) => {
                this.initialSalon = data['salon'] as ISalon;
                this.isReadOnly = data['readonly'];
                this.processSalonData();
                this.editForm = this.salonFormService.createSalonFormGroup(this.initialSalon);
                if (this.isReadOnly) {
                    this.activateReadOnlyMode();
                } else {
                    this.activateEditMode();
                }
                if (this.initialSalon?.id) {
                    this.loadActions();
                }

                if (this.initialSalon?.sourceSalonId) {
                    this.salonService.find(this.initialSalon.sourceSalonId).subscribe(res => {
                        this.sourceSalon = res.body;
                    });
                }
            });
    }
    loadActions(): void {
        const salonId = this.initialSalon?.id;
        if (!salonId) return;
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
        }
    }
    private handleBusinessAction(action: AvailableAction, htmlElement?: HTMLElement): void {
        const salonId = this.initialSalon?.id;
        if (!salonId) return;
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
            const targetElement = htmlElement || document.activeElement as HTMLElement;
            const confirmMessageKey = action.confirmationKey || 'common.confirmAction.default';
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
    activateReadOnlyMode(reset: boolean = true): void {
        this.isReadOnly = true;
        if (reset) {
            this.editForm = this.salonFormService.createSalonFormGroup(this.initialSalon);
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
    }
    private processSalonData(): void {
        if (!this.initialSalon) {
            this.initialSalon = {} as ISalon;
            this.initialSalon.priceStandSalons = [];
        }
        sortPriceStandSalon(this.initialSalon.priceStandSalons ?? []);
    }
}
