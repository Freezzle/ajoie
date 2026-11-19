import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {forkJoin} from 'rxjs';
import {finalize, map} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';

import {StandService} from '../service/stand.service';
import {IStand} from '../model/stand.interface';
import {StandFormGroup, StandFormService} from '../service/stand-form.service';
import {IParticipation, selectFilterParticipation, getParticipationUsageName} from '../../participation/model/participation.interface';
import {formatterParticipation, ParticipationService} from '../../participation/service/participation.service';
import {Category, formatterCategory} from '../../enumerations/category.model';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {NumberBoxComponent} from '../../../shared/components/number-box/number-box.component';
import {SelectBoxComponent} from '../../../shared/components/select-box/select-box.component';
import {CheckboxBoxComponent} from '../../../shared/components/checkbox-box/checkbox-box.component';
import {SalonService} from '../../salon/service/salon.service';
import {
    formatterDimensionStand,
    IPriceStandSalon,
    selectFilterDimension,
    sortPriceStandSalon
} from '../../salon/model/price-stand-salon.interface';

import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';
import {ConfirmPopup} from 'primeng/confirmpopup';

import {ChipsBoxComponent} from '../../../shared/components/chips-box/chips-box.component';
import {CardComponent} from '../../../shared/components/card/card.component';
import {CardFooterContentDirective} from '../../../shared/components/card/card-footer.directive';
import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {ImageUploadBoxComponent} from '../../../shared/components/image-upload-box/image-upload-box.component';
import {FieldListComponent} from '../../../shared/components/field-list/field-list.component';
import {FieldRowComponent} from '../../../shared/components/field-list/field-row.component';
import {YesNoIconComponent} from '../../../shared/components/yes-no-icon/yes-no-icon.component';
import {StatusTimelineComponent, StatusTimelineActionRequest} from '../../../shared/components/status-timeline/status-timeline.component';
import {NavigationStateService} from '../../../layouts/navbar/navigation-state.service';
import {loadParticipationOptions} from '../../common/participation/participation-options.util';
import {ActionsService} from '../../common/actions.service';
import {AvailableAction} from '../../../shared/model/available-action';
import {EntityAction} from '../../../shared/components/entity-list/entity-list.model';
import {getExhibitorFullName} from '../../exhibitor/model/exhibitor.interface';

const SECTION_CONTROLS: Record<string, string[]> = {
    stand: ['description', 'category', 'subCategories'],
    equipment: ['dimension', 'nbTable', 'nbChair', 'needElectricity'],
    communication: ['publishedOnWebsite', 'website', 'instagram', 'facebook', 'pictureUpload', 'removePicture'],
    coexhibitor: ['shared', 'sharedFirstName', 'sharedLastName', 'sharedTherapistName', 'sharedEmail', 'sharedDescription',
                  'sharedCategory', 'sharedSubCategories', 'sharedPublishedOnWebsite', 'sharedWebsite',
                  'sharedInstagram', 'sharedFacebook', 'sharedPictureUpload', 'removeSharedPicture'],
    internal: ['extraInformation']
};

@Component({
               selector: 'app-stand-update',
               templateUrl: './stand-update.component.html',
               styleUrl: './stand-update.component.scss',
               imports: [
                   SharedModule,
                   RouterModule,
                   FormsModule,
                   ReactiveFormsModule,
                   ButtonBoxComponent,
                   TextareaBoxComponent,
                   TextBoxComponent,
                   NumberBoxComponent,
                   SelectBoxComponent,
                   CheckboxBoxComponent,
                   ImageUploadBoxComponent,
                   AlertErrorComponent,
                   ConfirmPopup,
                   ChipsBoxComponent,
                   CardComponent,
                   CardFooterContentDirective,
                   ContentPageComponent,
                   FieldListComponent,
                  FieldRowComponent,
                  StatusTimelineComponent,
                  YesNoIconComponent
               ]
           })
export class StandUpdateComponent implements OnInit {
    isLoading = false;
    eventId!: string;
    initialStand: IStand | null = null;
    categoryValues = Object.keys(Category);
    participationsOptions: IParticipation[] = [];
    dimensionsOptions: IPriceStandSalon[] = [];
    picturePreviewUrl: string | null = null;
    sharedPicturePreviewUrl: string | null = null;

    readonly activeSection = signal<string | null>(null);
    readonly availableActions = signal<AvailableAction[]>([]);
    private sectionSnapshot: Record<string, unknown> = {};

    protected salonService = inject(SalonService);
    protected standService = inject(StandService);
    protected standFormService = inject(StandFormService);
    editForm: FormGroup<StandFormGroup> = this.standFormService.createStandFormGroup(null);
    protected participationService = inject(ParticipationService);
    protected navigationStateService = inject(NavigationStateService);
    protected activatedRoute = inject(ActivatedRoute);
    protected actionsService = inject(ActionsService);
    protected readonly formatterParticipation = formatterParticipation;
    protected readonly formatterDimensionStand = formatterDimensionStand;
    protected readonly formatterCategory = formatterCategory;
    protected readonly selectFilterDimension = selectFilterDimension;
    protected readonly selectFilterParticipation = selectFilterParticipation;
    protected readonly getExhibitorFullName = getExhibitorFullName;
    protected readonly getParticipationUsageName = getParticipationUsageName;
    readonly subtitle = computed(() => this.navigationStateService.currentSalonPlace(this.eventId));

    readonly standActions = computed<EntityAction[]>(() => this.sectionAction('stand'));
    readonly equipmentActions = computed<EntityAction[]>(() => this.sectionAction('equipment'));
    readonly communicationActions = computed<EntityAction[]>(() => this.sectionAction('communication'));
    readonly coexhibitorActions = computed<EntityAction[]>(() => this.sectionAction('coexhibitor'));
    readonly internalActions = computed<EntityAction[]>(() => this.sectionAction('internal'));

    get isCreating(): boolean {
        return !this.editForm.controls.id.value;
    }

    ngOnInit(): void {
        const data = this.activatedRoute.snapshot.data;
        this.eventId = this.activatedRoute.snapshot.paramMap.get('idSalon')!;
        const participationId = this.activatedRoute.snapshot.paramMap.get('idParticipation')!;
        this.initialStand = data['stand'] ? {...data['stand']} : null;
        this.editForm = this.standFormService.createStandFormGroup(this.initialStand);
        this.refreshPicturePreviews();

        if (this.isCreating) {
            this.editForm.enable();
        } else {
            this.editForm.disable();
            this.loadStatusActions(this.initialStand?.id);
        }

        this.loadRelationshipsOptions(this.eventId, participationId);
    }

    private sectionAction(section: string): EntityAction[] {
        if (this.isCreating || this.activeSection()) {
            return [];
        }
        return [{labelKey: 'common.edit', icon: 'pi pi-pencil', run: () => this.beginSection(section)}];
    }

    beginSection(section: string): void {
        if (!this.initialStand?.id || this.activeSection()) {
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
        this.refreshPicturePreviews();
    }

    saveSection(section: string): void {
        const names = SECTION_CONTROLS[section];
        const invalid = names.some(name => this.editForm.get(name)?.invalid);
        if (invalid) {
            names.forEach(name => this.editForm.get(name)?.markAsTouched());
            return;
        }

        this.isLoading = true;
        const stand = this.standFormService.getStand(this.editForm);
        this.standService.patch(this.initialStand!.id, stand)
            .pipe(finalize(() => (this.isLoading = false)))
            .subscribe(() => this.reloadStand(this.initialStand!.id));
    }

    onPictureRemoved(): void {
        this.editForm.controls.removePicture.setValue(true);
        this.editForm.controls.pictureUpload.updateValueAndValidity();
        this.picturePreviewUrl = null;
    }

    onSharedPictureRemoved(): void {
        this.editForm.controls.removeSharedPicture.setValue(true);
        this.editForm.controls.sharedPictureUpload.updateValueAndValidity();
        this.sharedPicturePreviewUrl = null;
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
        const stand = this.standFormService.getStand(this.editForm);
        this.standService.create(stand).pipe(finalize(() => (this.isLoading = false)))
            .subscribe(() => this.previousState());
    }

    onStatusAction(request: StatusTimelineActionRequest): void {
        this.isLoading = true;
        this.actionsService.businessAction(request.action.contextCode, this.initialStand!.id)
            .pipe(finalize(() => (this.isLoading = false)))
            .subscribe(() => this.reloadStand(this.initialStand!.id));
    }

    private reloadStand(id: string): void {
        this.standService.find(id).subscribe(response => {
            this.initialStand = response.body ? {...response.body} : null;
            this.editForm = this.standFormService.createStandFormGroup(this.initialStand);
            this.editForm.disable();
            this.activeSection.set(null);
            this.refreshPicturePreviews();
            this.loadStatusActions(this.initialStand?.id);
        });
    }

    private loadStatusActions(id: string | undefined): void {
        if (!id) {
            return;
        }
        this.actionsService.getAvailableActions('stand', id).subscribe(actions => this.availableActions.set(actions));
    }

    private snapshot(section: string): Record<string, unknown> {
        return Object.fromEntries(SECTION_CONTROLS[section].map(name => [name, this.editForm.get(name)?.value]));
    }

    private resetSectionControls(section: string): void {
        SECTION_CONTROLS[section].forEach(name => this.editForm.get(name)?.disable());
    }

    /**
     * Les images sont servies par un endpoint dédié : on ne manipule jamais les octets ici.
     */
    private refreshPicturePreviews(): void {
        const stand = this.initialStand;
        const cacheBuster = `?v=${Date.now()}`;

        this.picturePreviewUrl = stand?.id && stand.picture
                                 ? this.standService.pictureUrl(stand.id, 'MAIN') + cacheBuster
                                 : null;
        this.sharedPicturePreviewUrl = stand?.id && stand.sharedPicture
                                       ? this.standService.pictureUrl(stand.id, 'SHARED') + cacheBuster
                                       : null;
    }

    protected loadRelationshipsOptions(eventId: string, participationId: string | null): void {
        const participations$ = loadParticipationOptions(
            eventId,
            participationId,
            this.participationService,
            participation => this.editForm.get('participation')?.setValue(participation)
        );

        const dimensions$ = this.salonService.getDimensionStands(eventId)
                                .pipe(map(dimensionStands => sortPriceStandSalon(dimensionStands)));

        forkJoin({participations: participations$, dimensions: dimensions$})
            .subscribe(({participations, dimensions}) => {
                this.participationsOptions = participations;
                this.dimensionsOptions = dimensions;
            });
    }
}
