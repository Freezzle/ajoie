import {Injectable} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {IStand} from '../model/stand.interface';
import {CustomValidatorModel} from '../../../shared/field-error/custom-validator.model';
import {requiredPictureValidator} from '../../../shared/components/image-upload-box/image-upload.validator';
import {Status} from '../../enumerations/status.model';

export type StandFormGroup = {
    id: FormControl<IStand['id'] | null>;
    description: FormControl<IStand['description'] | null>;
    publishedOnWebsite: FormControl<IStand['publishedOnWebsite'] | null>;
    website: FormControl<IStand['website'] | null>;
    instagram: FormControl<IStand['instagram'] | null>;
    facebook: FormControl<IStand['facebook'] | null>;
    urlPicture: FormControl<IStand['urlPicture'] | null>;
    shared: FormControl<IStand['shared'] | null>;
    nbTable: FormControl<IStand['nbTable'] | null>;
    nbChair: FormControl<IStand['nbChair'] | null>;
    needElectricity: FormControl<IStand['needElectricity'] | null>;
    sharedFirstName: FormControl<IStand['sharedFirstName'] | null>;
    sharedLastName: FormControl<IStand['sharedLastName'] | null>;
    sharedTherapistName: FormControl<IStand['sharedTherapistName'] | null>;
    sharedEmail: FormControl<IStand['sharedEmail'] | null>;
    sharedDescription: FormControl<IStand['sharedDescription'] | null>;
    sharedCategory: FormControl<IStand['sharedCategory'] | null>;
    sharedSubCategories: FormControl<IStand['sharedSubCategories'] | null>;
    sharedPublishedOnWebsite: FormControl<IStand['sharedPublishedOnWebsite'] | null>;
    sharedWebsite: FormControl<IStand['sharedWebsite'] | null>;
    sharedInstagram: FormControl<IStand['sharedInstagram'] | null>;
    sharedFacebook: FormControl<IStand['sharedFacebook'] | null>;
    sharedUrlPicture: FormControl<IStand['sharedUrlPicture'] | null>;
    status: FormControl<IStand['status'] | null>;
    category: FormControl<IStand['category'] | null>;
    subCategories: FormControl<IStand['subCategories'] | null>;
    extraInformation: FormControl<IStand['extraInformation'] | null>;
    participation: FormControl<IStand['participation'] | null>;
    dimension: FormControl<IStand['dimension'] | null>;
    pictureUpload: FormControl<IStand['pictureUpload']>;
    sharedPictureUpload: FormControl<IStand['sharedPictureUpload']>;
    removePicture: FormControl<boolean>;
    removeSharedPicture: FormControl<boolean>;
};

@Injectable({providedIn: 'root'})
export class StandFormService {
    createStandFormGroup(stand: IStand | null): FormGroup<StandFormGroup> {
        const raw: IStand = {
            ...this.getDefaultStandFormValue() as IStand,
            ...(stand ?? {})
        };

        // Une image déjà enregistrée satisfait l'obligation tant qu'elle n'est pas supprimée.
        const removePicture = new FormControl(false, {nonNullable: true});
        const removeSharedPicture = new FormControl(false, {nonNullable: true});
        const hasPicture = (): boolean => !!raw.picture && !removePicture.value;
        const hasSharedPicture = (): boolean => !!raw.sharedPicture && !removeSharedPicture.value;
        // Les images ne sont exigées que si le stand / le co-exposant est publié sur le site web.
        const published = (): boolean => form.controls.publishedOnWebsite.value !== false;
        const sharedPublished = (): boolean => form.controls.sharedPublishedOnWebsite.value !== false;

        const form = new FormGroup<StandFormGroup>({
                                                 id: new FormControl(raw.id),
                                                 description: new FormControl(raw.description, [
                                                     Validators.required,
                                                     Validators.maxLength(500)
                                                 ]),
                                                 publishedOnWebsite: new FormControl(raw.publishedOnWebsite,
                                                     Validators.required),
                                                 website: new FormControl(raw.website),
                                                 instagram: new FormControl(raw.instagram),
                                                 facebook: new FormControl(raw.facebook),
                                                 urlPicture: new FormControl(raw.urlPicture),
                                                 shared: new FormControl(raw.shared, Validators.required),
                                                 nbTable: new FormControl(raw.nbTable, [
                                                     Validators.required,
                                                     CustomValidatorModel.onlyNumbers
                                                 ]),
                                                 nbChair: new FormControl(raw.nbChair, [
                                                     Validators.required,
                                                     CustomValidatorModel.onlyNumbers
                                                 ]),
                                                 needElectricity: new FormControl(raw.needElectricity, Validators.required),
                                                 sharedFirstName: new FormControl(raw.sharedFirstName),
                                                 sharedLastName: new FormControl(raw.sharedLastName),
                                                 sharedTherapistName: new FormControl(raw.sharedTherapistName),
                                                 sharedEmail: new FormControl(raw.sharedEmail),
                                                 sharedDescription: new FormControl(raw.sharedDescription,
                                                     Validators.maxLength(500)),
                                                 sharedCategory: new FormControl(raw.sharedCategory),
                                                 sharedSubCategories: new FormControl(raw.sharedSubCategories),
                                                 sharedPublishedOnWebsite: new FormControl(
                                                     raw.sharedPublishedOnWebsite, Validators.required),
                                                 sharedWebsite: new FormControl(raw.sharedWebsite),
                                                 sharedInstagram: new FormControl(raw.sharedInstagram),
                                                 sharedFacebook: new FormControl(raw.sharedFacebook),
                                                 sharedUrlPicture: new FormControl(raw.sharedUrlPicture),
                                                 status: new FormControl(raw.status, Validators.required),
                                                 category: new FormControl(raw.category),
                                                 subCategories: new FormControl(raw.subCategories),
                                                 extraInformation: new FormControl(raw.extraInformation),
                                                 participation: new FormControl(raw.participation, Validators.required),
                                                 dimension: new FormControl(raw.dimension, Validators.required),
                                                 pictureUpload: new FormControl(null,
                                                     [requiredPictureValidator(() => !published() || hasPicture())]),
                                                 sharedPictureUpload: new FormControl(null),
                                                 removePicture,
                                                 removeSharedPicture
                                             });

        // L'image du co-exposant n'est exigée que si le stand est partagé et le co-exposant publié.
        const refreshSharedPictureValidator = (shared: boolean | null): void => {
            form.controls.sharedPictureUpload.setValidators(
                shared && sharedPublished() ? [requiredPictureValidator(hasSharedPicture)] : []);
            form.controls.sharedPictureUpload.updateValueAndValidity({emitEvent: false});
        };

        refreshSharedPictureValidator(raw.shared);
        form.controls.shared.valueChanges.subscribe(shared => {
            if (!shared) {
                this.clearCoExhibitor(form);
            }
            refreshSharedPictureValidator(shared);
        });

        form.controls.publishedOnWebsite.valueChanges.subscribe(isPublished => {
            if (isPublished) {
                // La publication est rétablie : l'image existante ne doit plus être supprimée.
                form.controls.removePicture.setValue(false, {emitEvent: false});
            } else {
                this.clearPublication(form);
            }
            form.controls.pictureUpload.updateValueAndValidity({emitEvent: false});
        });

        form.controls.sharedPublishedOnWebsite.valueChanges.subscribe(isPublished => {
            if (isPublished) {
                form.controls.removeSharedPicture.setValue(false, {emitEvent: false});
            } else {
                this.clearSharedPublication(form);
            }
            refreshSharedPictureValidator(form.controls.shared.value);
        });

        return form;
    }

    /**
     * Efface les informations de l'exposant publiées sur le site web (réseaux sociaux et image)
     * quand la publication est désactivée.
     */
    private clearPublication(form: FormGroup<StandFormGroup>): void {
        form.patchValue({
                            website: null,
                            instagram: null,
                            facebook: null,
                            urlPicture: null,
                            pictureUpload: null,
                            removePicture: true
                        }, {emitEvent: false});
    }

    /**
     * Efface les informations du co-exposant publiées sur le site web (réseaux sociaux et image)
     * quand sa publication est désactivée.
     */
    private clearSharedPublication(form: FormGroup<StandFormGroup>): void {
        form.patchValue({
                            sharedWebsite: null,
                            sharedInstagram: null,
                            sharedFacebook: null,
                            sharedUrlPicture: null,
                            sharedPictureUpload: null,
                            removeSharedPicture: true
                        }, {emitEvent: false});
    }

    /** Remet à zéro les informations du co-exposant quand le stand n'est plus partagé. */
    private clearCoExhibitor(form: FormGroup<StandFormGroup>): void {
        form.patchValue({
                            sharedFirstName: null,
                            sharedLastName: null,
                            sharedTherapistName: null,
                            sharedEmail: null,
                            sharedDescription: null,
                            sharedCategory: null,
                            sharedSubCategories: [],
                            sharedPublishedOnWebsite: true,
                            sharedWebsite: null,
                            sharedInstagram: null,
                            sharedFacebook: null,
                            sharedPictureUpload: null
                        }, {emitEvent: false});
    }

    getStand(form: FormGroup<StandFormGroup>): IStand {
        return form.getRawValue() as IStand;
    }

    private getDefaultStandFormValue(): Pick<IStand,
        'status' | 'nbTable' | 'nbChair' | 'subCategories' | 'needElectricity'
        | 'shared' | 'sharedSubCategories' | 'publishedOnWebsite' | 'sharedPublishedOnWebsite'> {
        return {
            status: Status.IN_VERIFICATION,
            nbTable: 0,
            nbChair: 0,
            needElectricity: true,
            subCategories: [],
            shared: false,
            sharedSubCategories: [],
            publishedOnWebsite: true,
            sharedPublishedOnWebsite: true
        };
    }
}
