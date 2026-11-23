import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {Observable, of} from 'rxjs';
import {finalize, map, shareReplay} from 'rxjs/operators';

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
import {CardFooterContentDirective} from '../../../shared/components/card/card-footer.directive';
import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {Rating} from 'primeng/rating';
import {NavigationStateService} from '../../../layouts/navbar/navigation-state.service';
import {AddressFormComponent} from '../../../shared/components/address-form/address-form.component';
import {IAddress} from '../../common/address.model';
import {FieldListComponent} from '../../../shared/components/field-list/field-list.component';
import {FieldRowComponent} from '../../../shared/components/field-list/field-row.component';
import {YesNoIconComponent} from '../../../shared/components/yes-no-icon/yes-no-icon.component';
import {EntityAction} from '../../../shared/components/entity-list/entity-list.model';
import {TabsComponent} from '../../../shared/components/tabs/tabs.component';
import {TabPanelDirective, AppTab} from '../../../shared/components/tabs/tab-panel.directive';
import {SideLabelsComponent} from '../../../shared/components/side-labels/side-labels.component';
import {SideLabelComponent} from '../../../shared/components/side-labels/side-label.component';
import {SideLabelHostDirective} from '../../../shared/components/side-labels/side-label-host.directive';
import {EventLogListComponent} from '../../../shared/components/event-log-list/event-log-list.component';
import {EventLog} from '../../../shared/event-modal/event.interface';
import {Notif} from '../../../shared/components/notif-badge/notif.model';
import {DetailPageLayoutComponent} from '../../../shared/components/detail-page-layout/detail-page-layout.component';
import {
    DetailCreateActionsDirective,
    DetailMainDirective,
    DetailSideDirective
} from '../../../shared/components/detail-page-layout/detail-page-layout-slots.directive';

const SECTION_CONTROLS: Record<string, string[]> = {
    identity: ['firstName', 'lastName', 'email', 'phoneNumber', 'language', 'newsletter'],
    homeAddress: ['homeAddress'],
    billing: ['differentBillingAddress', 'billingAddress'],
    internal: ['redFlag', 'duplicateDetected', 'extraInformation']
};

@Component({
               selector: 'app-exhibitor-update',
               templateUrl: './exhibitor-update.component.html',
               styleUrl: './exhibitor-update.component.scss',
               imports: [
                   SharedModule,
                   RouterModule,
                   FormsModule,
                   ReactiveFormsModule,
                   ColorStatusPipe,
                   StatusPipe,
                   ButtonBoxComponent,
                   TextBoxComponent,
                   TextareaBoxComponent,
                   SelectBoxComponent,
                   CheckboxBoxComponent,
                   AlertErrorComponent,

                   TableModule,
                   ConfirmPopup,

                   CardComponent,
                   CardFooterContentDirective,
                   ContentPageComponent,
                   FieldListComponent,
                   FieldRowComponent,
                   Rating,
                  AddressFormComponent,
                  YesNoIconComponent,
                  DetailPageLayoutComponent,
                  DetailMainDirective,
                  DetailSideDirective,
                  DetailCreateActionsDirective,
                  TabsComponent,
                  TabPanelDirective,
                  SideLabelsComponent,
                  SideLabelComponent,
                  SideLabelHostDirective,
                  EventLogListComponent
               ]
           })
export class ExhibitorUpdateComponent implements OnInit {
    isLoading = false;
    initialExhibitor: IExhibitor | null = null;
    languageValues = LANGUAGES;
    participations$: Observable<IParticipation[]> = of([]);
    eventLogs$: Observable<EventLog[]> | undefined;
    private cachedBillingAddress: IAddress | null = null;

    viewTab = 'ess';
    readonly side = signal<string | null>(null);
    readonly viewTabs: AppTab[] = [
        {key: 'ess', labelKey: 'global.tab.essential', icon: 'pi pi-star'},
        {key: 'addresses', labelKey: 'exhibitor.addresses', icon: 'pi pi-map-marker'}
    ];

    readonly activeSection = signal<string | null>(null);
    private sectionSnapshot: Record<string, unknown> = {};

    protected exhibitorService = inject(ExhibitorService);
    protected countryService = inject(CountryService);
    stateService = inject(NavigationStateService);
    protected exhibitorFormService = inject(ExhibitorFormService);
    editForm: ExhibitorFormGroup = this.exhibitorFormService.createExhibitorFormGroup(null);
    protected activatedRoute = inject(ActivatedRoute);
    protected readonly formatterLanguage = formatterLanguage;
    protected readonly formatterCountry = formatterCountry;

    readonly identityActions = computed<EntityAction[]>(() => this.sectionAction('identity'));
    readonly homeAddressActions = computed<EntityAction[]>(() => this.sectionAction('homeAddress'));
    readonly billingActions = computed<EntityAction[]>(() => this.sectionAction('billing'));
    readonly internalActions = computed<EntityAction[]>(() => this.sectionAction('internal'));

    get isCreating(): boolean {
        return !this.editForm.controls.id.value;
    }

    get internalBadge(): Notif | null {
        const count = (this.editForm.controls.redFlag.value ? 1 : 0)
            + (this.editForm.controls.duplicateDetected.value ? 1 : 0);
        if (count > 0) {
            return {type: 'danger', value: count};
        }
        if (this.editForm.controls.extraInformation.value) {
            return {type: 'warning', dot: true};
        }
        return null;
    }

    ngOnInit(): void {
        const data = this.activatedRoute.snapshot.data;
        this.initialExhibitor = data['exhibitor'] ? {...data['exhibitor']} : null;
        this.setupForm(this.initialExhibitor);
        this.loadRelationships(this.editForm.controls.id.value);
    }

    private setupForm(exhibitor: IExhibitor | null): void {
        this.editForm = this.exhibitorFormService.createExhibitorFormGroup(exhibitor);
        this.cachedBillingAddress = this.editForm.controls.billingAddress.value;

        if (this.isCreating) {
            this.editForm.enable();
        } else {
            this.editForm.disable();
        }

        this.editForm.controls.differentBillingAddress.valueChanges.subscribe((enabled) => {
            this.onBillingAddressToggle(enabled ?? false);
        });
    }

    private sectionAction(section: string): EntityAction[] {
        if (this.isCreating || this.activeSection()) {
            return [];
        }
        return [{labelKey: 'common.edit', icon: 'pi pi-pencil', run: () => this.beginSection(section)}];
    }

    beginSection(section: string): void {
        if (!this.initialExhibitor?.id || this.activeSection()) {
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
        const exhibitor = this.exhibitorFormService.getExhibitor(this.editForm);
        this.exhibitorService.patch(this.initialExhibitor!.id, exhibitor)
            .pipe(finalize(() => (this.isLoading = false)))
            .subscribe(() => this.reloadExhibitor(this.initialExhibitor!.id));
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
        const exhibitor = this.exhibitorFormService.getExhibitor(this.editForm);
        this.exhibitorService.create(exhibitor)
            .pipe(finalize(() => (this.isLoading = false)))
            .subscribe(() => this.previousState());
    }

    loadEventLogsOnce(): Observable<EventLog[]> {
        if (!this.initialExhibitor?.id) {
            return of([]);
        }
        this.eventLogs$ ??= this.exhibitorService.getEventLogs(this.initialExhibitor.id).pipe(
            map(res => res.body ?? []),
            shareReplay(1)
        );
        return this.eventLogs$;
    }

    private reloadExhibitor(id: string): void {
        this.exhibitorService.find(id).subscribe(response => {
            this.initialExhibitor = response.body ? {...response.body} : null;
            this.eventLogs$ = undefined;
            this.setupForm(this.initialExhibitor);
            this.activeSection.set(null);
        });
    }

    private snapshot(section: string): Record<string, unknown> {
        return Object.fromEntries(SECTION_CONTROLS[section].map(name => [name, this.editForm.get(name)?.value]));
    }

    private resetSectionControls(section: string): void {
        SECTION_CONTROLS[section].forEach(name => this.editForm.get(name)?.disable());
    }

    loadRelationships(idExhibitor: string | null): void {
        if (!idExhibitor) {
            return;
        }
        this.participations$ = this.exhibitorService.findParticipations(idExhibitor);
    }

    onBillingAddressToggle(enabled: boolean): void {
        if (enabled) {
            const addressToRestore = this.cachedBillingAddress ?? this.getDefaultAddress();
            this.editForm.controls.billingAddress.setValue(addressToRestore);
        } else {
            const currentValue = this.editForm.controls.billingAddress.value;
            if (currentValue) {
                this.cachedBillingAddress = currentValue;
            }
            this.editForm.controls.billingAddress.setValue(null);
        }
    }

    hasAddress(address: IAddress | null | undefined): boolean {
        return !!(address?.street ?? address?.postalCode ?? address?.city);
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
