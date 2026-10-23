import {Component, inject, OnInit} from '@angular/core';
import {HttpResponse} from '@angular/common/http';
import {ActivatedRoute} from '@angular/router';
import {forkJoin, of} from 'rxjs';
import {catchError, finalize, map} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';

import {StandService} from '../service/stand.service';
import {IStand} from '../model/stand.interface';
import {StandFormGroup, StandFormService} from '../service/stand-form.service';
import {IParticipation, selectFilterParticipation} from '../../participation/model/participation.interface';
import {formatterParticipation, ParticipationService} from '../../participation/service/participation.service';
import {formatterStatus, Status} from '../../enumerations/status.model';
import {Category, formatterCategory} from '../../enumerations/category.model';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {NumberBoxComponent} from '../../../shared/components/number-box/number-box.component';
import {SelectBoxComponent} from '../../../shared/components/select-box/select-box.component';
import {CheckboxBoxComponent} from '../../../shared/components/checkbox-box/checkbox-box.component';
import {LinkBoxComponent} from '../../../shared/components/link-box/link-box.component';
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
import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {ImageUploadBoxComponent} from '../../../shared/components/image-upload-box/image-upload-box.component';

@Component({
               selector: 'app-stand-update',
               templateUrl: './stand-update.component.html',
               imports: [
                   SharedModule,
                   FormsModule,
                   ReactiveFormsModule,
                   ButtonBoxComponent,
                   TextareaBoxComponent,
                   TextBoxComponent,
                   NumberBoxComponent,
                   SelectBoxComponent,
                   CheckboxBoxComponent,
                   LinkBoxComponent,
                   ImageUploadBoxComponent,

                   AlertErrorComponent,
                   ConfirmPopup,
                   
                   ChipsBoxComponent,
                   CardComponent,
                   ContentPageComponent
               ]
           })
export class StandUpdateComponent implements OnInit {
    isLoading = false;
    isReadOnly = false;
    eventId!: string;
    initialStand: IStand | null = null;
    statusValues = Object.keys(Status);
    categoryValues = Object.keys(Category);
    participationsOptions: IParticipation[] = [];
    dimensionsOptions: IPriceStandSalon[] = [];
    picturePreviewUrl: string | null = null;
    sharedPicturePreviewUrl: string | null = null;
    protected salonService = inject(SalonService);
    protected standService = inject(StandService);
    protected standFormService = inject(StandFormService);
    editForm: FormGroup<StandFormGroup> = this.standFormService.createStandFormGroup(null);
    protected participationService = inject(ParticipationService);
    protected activatedRoute = inject(ActivatedRoute);
    protected readonly formatterParticipation = formatterParticipation;
    protected readonly formatterDimensionStand = formatterDimensionStand;
    protected readonly formatterStatus = formatterStatus;
    protected readonly formatterCategory = formatterCategory;
    protected readonly selectFilterDimension = selectFilterDimension;
    protected readonly selectFilterParticipation = selectFilterParticipation;

    ngOnInit(): void {
        const data = this.activatedRoute.snapshot.data;

        this.eventId = this.activatedRoute.snapshot.paramMap.get('idSalon')!;
        const participationId = this.activatedRoute.snapshot.paramMap.get('idParticipation')!;
        this.initialStand = {...data['stand']};
        this.editForm = this.standFormService.createStandFormGroup(this.initialStand);
        this.refreshPicturePreviews();

        if (data['readonly']) {
            this.isReadOnly = true;
            this.editForm.disable();
        } else {
            this.edit();
        }

        this.loadRelationshipsOptions(this.eventId, participationId);
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

    edit(): void {
        this.isReadOnly = false;
        this.editForm.enable();
    }

    previousState(): void {
        window.history.back();
    }

    cancel(): void {
        this.isReadOnly = true;
        this.editForm = this.standFormService.createStandFormGroup(this.initialStand);
        this.editForm.disable();
        this.refreshPicturePreviews();
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

    save(): void {
        if (this.editForm.invalid) {
            this.editForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;

        const stand = this.standFormService.getStand(this.editForm);
        const saveOperation = stand.id != null
                              ? this.standService.update(stand)
                              : this.standService.create(stand);

        saveOperation.pipe(finalize(() => (this.isLoading = false))).subscribe(() => this.previousState());
    }

    protected loadRelationshipsOptions(eventId: string, participationId: string | null): void {
        const participations$ =
            this.participationService
                .query(eventId)
                .pipe(
                    map((res: HttpResponse<IParticipation[]>) => res.body ?? []),
                    map((participations) => {
                        if (participationId) {
                            this.editForm.get('participation')?.setValue(
                                participations.find((p) => p.id === participationId) ?? null
                            );
                        }
                        return participations;
                    }),
                    catchError(() => of([])));

        const dimensions$ =
            this.salonService
                .getDimensionStands(eventId)
                .pipe(
                    map((dimensionStands) => sortPriceStandSalon(dimensionStands)),
                    catchError(() => of([])));

        forkJoin({participations: participations$, dimensions: dimensions$})
            .subscribe(({participations, dimensions}) => {
                this.participationsOptions = participations;
                this.dimensionsOptions = dimensions;
            });
    }
}
