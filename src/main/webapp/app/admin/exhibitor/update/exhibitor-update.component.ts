import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {Observable, of} from 'rxjs';
import {finalize} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ExhibitorService} from '../service/exhibitor.service';
import {ExhibitorFormGroup, ExhibitorFormService} from '../service/exhibitor-form.service';
import {formatterLanguage, LANGUAGES} from '../../../config/language.constants';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import StatusPipe from '../../../shared/pipe/status.pipe';
import {IParticipation} from '../../participation/model/participation.interface';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {SelectBoxComponent} from '../../../shared/components/select-box/select-box.component';
import {IExhibitor} from '../model/exhibitor.interface';
import {CheckboxBoxComponent} from '../../../shared/components/checkbox-box/checkbox-box.component';
import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';

import {TableModule} from 'primeng/table';
import {ConfirmPopup} from 'primeng/confirmpopup';

import {CountryService, formatterCountry} from '../../../shared/country.service';
import {CardComponent} from '../../../shared/components/card/card.component';
import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {Rating} from 'primeng/rating';
import {NavigationStateService} from '../../../layouts/navbar/navigation-state.service';
import {AddressFormComponent} from '../../../shared/components/address-form/address-form.component';
import {IAddress} from '../../common/address.model';

@Component({
               selector: 'app-exhibitor-update',
               templateUrl: './exhibitor-update.component.html',
               imports: [
                   SharedModule,
                   FormsModule,
                   ReactiveFormsModule,
                   ColorStatusPipe,
                   StatusPipe,
                   RouterLink,
                   ButtonBoxComponent,
                   TextBoxComponent,
                   TextareaBoxComponent,
                   SelectBoxComponent,
                   CheckboxBoxComponent,
                   AlertErrorComponent,

                   TableModule,
                   ConfirmPopup,

                   CardComponent,
                   ContentPageComponent,
                   Rating,
                   AddressFormComponent
               ]
           })
export class ExhibitorUpdateComponent implements OnInit {
    isLoading = false;
    isReadOnly = false;
    initialExhibitor: IExhibitor | null = null;
    languageValues = LANGUAGES;
    participations$: Observable<IParticipation[]> = of([]);
    private cachedBillingAddress: IAddress | null = null;
    protected exhibitorService = inject(ExhibitorService);
    protected countryService = inject(CountryService);
    stateService = inject(NavigationStateService);
    protected exhibitorFormService = inject(ExhibitorFormService);
    editForm: ExhibitorFormGroup = this.exhibitorFormService.createExhibitorFormGroup(null);
    protected activatedRoute = inject(ActivatedRoute);
    protected readonly formatterLanguage = formatterLanguage;
    protected readonly formatterCountry = formatterCountry;

    ngOnInit(): void {
        const data = this.activatedRoute.snapshot.data;

        this.initialExhibitor = {...data['exhibitor']};
        this.editForm = this.exhibitorFormService.createExhibitorFormGroup(this.initialExhibitor);

        if (data['readonly']) {
            this.isReadOnly = true;
            this.editForm.disable();
        } else {
            this.edit();
        }

        this.loadRelationships(this.editForm.controls.id.value);

        // Initialiser le cache si billingAddress existe déjà
        if (this.editForm.controls.billingAddress.value) {
            this.cachedBillingAddress = this.editForm.controls.billingAddress.value;
        }

        // Souscrire aux changements du switch differentBillingAddress
        this.editForm.controls.differentBillingAddress.valueChanges.subscribe((enabled) => {
            this.onBillingAddressToggle(enabled ?? false);
        });
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
        this.editForm = this.exhibitorFormService.createExhibitorFormGroup(this.initialExhibitor);
        this.editForm.disable();
        this.cachedBillingAddress = this.initialExhibitor?.billingAddress ?? null;
    }

    save(): void {
        if (this.editForm.invalid) {
            this.editForm.markAllAsTouched();
            return;
        }
        this.isLoading = true;
        const exhibitor = this.exhibitorFormService.getExhibitor(this.editForm);

        const saveOperation = exhibitor.id != null
                              ? this.exhibitorService.update(exhibitor)
                              : this.exhibitorService.create(exhibitor);

        saveOperation.pipe(finalize(() => (this.isLoading = false))).subscribe(() => this.previousState());
    }

    loadRelationships(idExhibitor: string | null): void {
        if (!idExhibitor) {
            return;
        }
        this.participations$ = this.exhibitorService.findParticipations(idExhibitor);
    }

    onBillingAddressToggle(enabled: boolean): void {
        if (enabled) {
            // Si activé, restaurer le cache ou créer une adresse par défaut
            const addressToRestore = this.cachedBillingAddress ?? this.getDefaultAddress();
            this.editForm.controls.billingAddress.setValue(addressToRestore);
        } else {
            // Si désactivé, sauvegarder en cache et mettre à null
            const currentValue = this.editForm.controls.billingAddress.value;
            if (currentValue) {
                this.cachedBillingAddress = currentValue;
            }
            this.editForm.controls.billingAddress.setValue(null);
        }
    }

    private getDefaultAddress(): IAddress {
        return {
            id: null,
            formalLine: null,
            fullName: null,
            postalCase: null,
            street: null,
            houseNumber: null,
            postalCode: null,
            city: null,
            isoCountry: 'CH',
            extraLine: null
        };
    }
}
