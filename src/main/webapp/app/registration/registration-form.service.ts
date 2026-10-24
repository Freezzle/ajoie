import {Injectable} from '@angular/core';
import {
    AbstractControl,
    FormArray,
    FormControl,
    FormGroup,
    ValidationErrors,
    ValidatorFn,
    Validators
} from '@angular/forms';

import {Category} from '../admin/enumerations/category.model';
import {ProcessedImageUpload} from '../shared/utils/image-resize.util';
import {requiredPictureValidator} from '../shared/components/image-upload-box/image-upload.validator';
import {InvoiceSendingMethod} from '../admin/enumerations/invoice-sending-method.model';
import {ModePaymentMeals} from '../admin/enumerations/mode-payment-meals.model';
import {IAddress} from '../admin/common/address.model';
import {
    IRegistrationImageUpload,
    IRegistrationRequest,
    IRegistrationStand,
    IRegistrationTalk
} from './registration.model';

export type TalkFormGroup = FormGroup<{
    title: FormControl<string | null>;
    description: FormControl<string | null>;
}>;

export type StandFormGroup = FormGroup<{
    description: FormControl<string | null>;
    dimension: FormControl<any>;
    category: FormControl<Category | null>;
    subCategories: FormControl<string[] | null>;
    nbTable: FormControl<number | null>;
    nbChair: FormControl<number | null>;
    needElectricity: FormControl<boolean | null>;
    shared: FormControl<boolean | null>;
    website: FormControl<string | null>;
    instagram: FormControl<string | null>;
    facebook: FormControl<string | null>;
    sharedFirstName: FormControl<string | null>;
    sharedLastName: FormControl<string | null>;
    sharedTherapistName: FormControl<string | null>;
    sharedEmail: FormControl<string | null>;
    sharedDescription: FormControl<string | null>;
    sharedCategory: FormControl<Category | null>;
    sharedSubCategories: FormControl<string[] | null>;
    sharedWebsite: FormControl<string | null>;
    sharedInstagram: FormControl<string | null>;
    sharedFacebook: FormControl<string | null>;
    pictureUpload: FormControl<ProcessedImageUpload | null>;
    sharedPictureUpload: FormControl<ProcessedImageUpload | null>;
    hasPicture: FormControl<boolean>;
    hasSharedPicture: FormControl<boolean>;
}>;

export type ExhibitorFormGroup = FormGroup<{
    firstName: FormControl<string | null>;
    lastName: FormControl<string | null>;
    therapistName: FormControl<string | null>;
    email: FormControl<string | null>;
    phoneNumber: FormControl<string | null>;
    homeAddress: FormControl<IAddress | null>;
    differentBillingAddress: FormControl<boolean | null>;
    billingAddress: FormControl<IAddress | null>;
    language: FormControl<string | null>;
    newsletter: FormControl<boolean | null>;
}>;

export type ServicesFormGroup = FormGroup<{
    wantStand: FormControl<boolean | null>;
    wantConference: FormControl<boolean | null>;
    wantWorkshop: FormControl<boolean | null>;
    stand: StandFormGroup;
    conferences: FormArray<TalkFormGroup>;
    workshops: FormArray<TalkFormGroup>;
}>;

export type ParticipationFormGroup = FormGroup<{
    nbMeal1: FormControl<number | null>;
    nbMeal2: FormControl<number | null>;
    nbMeal3: FormControl<number | null>;
    modePaymentMeals: FormControl<ModePaymentMeals | null>;
    invoiceSendingMethod: FormControl<InvoiceSendingMethod | null>;
    hasOffer: FormControl<boolean | null>;
    offer: FormControl<string | null>;
    additionnalInformation: FormControl<string | null>;
}>;

export type ConsentsFormGroup = FormGroup<{
    acceptedChart: FormControl<boolean | null>;
    acceptedContract: FormControl<boolean | null>;
}>;

export type RegistrationFormGroup = FormGroup<{
    exhibitor: ExhibitorFormGroup;
    services: ServicesFormGroup;
    participation: ParticipationFormGroup;
    consents: ConsentsFormGroup;
}>;

export type RegistrationFormValue = ReturnType<RegistrationFormGroup['getRawValue']>;

/**
 * Une adresse est valide si la rue, le n°, le NPA, la localité et le pays sont renseignés.
 * Les mêmes champs sont marqués obligatoires par `AddressFormComponent` : les deux doivent rester alignés.
 */
export function requiredAddressValidator(options?: {requireFullName?: boolean}): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value as IAddress | null;
        const filled = !!value && !!value.street?.trim() && !!value.houseNumber?.trim() &&
            !!value.postalCode?.trim() && !!value.city?.trim() && !!value.isoCountry?.trim() &&
            (!options?.requireFullName || !!value.fullName?.trim());
        return filled ? null : {required: true};
    };
}

/** Au moins une prestation doit être demandée. */
export function atLeastOneServiceValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const group = control as ServicesFormGroup;
        const answered = [group.controls.wantStand, group.controls.wantConference, group.controls.wantWorkshop]
            .every(c => c.value !== null);

        if (!answered) {
            return {serviceAnswerMissing: true};
        }

        const chosen = [group.controls.wantStand, group.controls.wantConference, group.controls.wantWorkshop]
            .some(c => c.value === true);

        return chosen ? null : {noServiceChosen: true};
    };
}

export function mustBeTrueValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => (control.value === true ? null : {required: true});
}

/**
 * N'envoie au serveur que ce dont il a besoin : l'aperçu (`previewUrl`) est un doublon base64 de
 * `dataBase64` qui doublerait inutilement la taille de la requête.
 */
function toImagePayload(upload: ProcessedImageUpload | null | undefined): IRegistrationImageUpload | null {
    if (!upload) {
        return null;
    }
    return {
        filename: upload.filename,
        contentType: upload.contentType,
        dataBase64: upload.dataBase64
    };
}

@Injectable({providedIn: 'root'})
export class RegistrationFormService {

    createForm(): RegistrationFormGroup {
        const form: RegistrationFormGroup = new FormGroup({
            exhibitor: this.createExhibitorGroup(),
            services: this.createServicesGroup(),
            participation: this.createParticipationGroup(),
            consents: this.createConsentsGroup()
        });

        this.wireConditionalValidators(form);

        return form;
    }

    // -------------------- GROUPES --------------------

    private createExhibitorGroup(): ExhibitorFormGroup {
        return new FormGroup({
            firstName: new FormControl<string | null>(null, [Validators.required, Validators.maxLength(100)]),
            lastName: new FormControl<string | null>(null, [Validators.required, Validators.maxLength(100)]),
            therapistName: new FormControl<string | null>(null, [Validators.maxLength(100)]),
            email: new FormControl<string | null>(null,
                [Validators.required, Validators.email, Validators.maxLength(100)]),
            phoneNumber: new FormControl<string | null>(null, [Validators.maxLength(50)]),
            homeAddress: new FormControl<IAddress | null>(null, [requiredAddressValidator()]),
            differentBillingAddress: new FormControl<boolean | null>(false),
            billingAddress: new FormControl<IAddress | null>(null),
            language: new FormControl<string | null>('fr'),
            newsletter: new FormControl<boolean | null>(true)
        });
    }

    private createServicesGroup(): ServicesFormGroup {
        const group: ServicesFormGroup = new FormGroup({
            wantStand: new FormControl<boolean | null>(null),
            wantConference: new FormControl<boolean | null>(null),
            wantWorkshop: new FormControl<boolean | null>(null),
            stand: this.createStandGroup(),
            conferences: new FormArray<TalkFormGroup>([]),
            workshops: new FormArray<TalkFormGroup>([])
        }, {validators: atLeastOneServiceValidator()});

        group.controls.stand.disable({emitEvent: false});
        group.controls.conferences.disable({emitEvent: false});
        group.controls.workshops.disable({emitEvent: false});

        return group;
    }

    createStandGroup(): StandFormGroup {
        const hasPicture = new FormControl(false, {nonNullable: true});
        const hasSharedPicture = new FormControl(false, {nonNullable: true});

        return new FormGroup({
            description: new FormControl<string | null>(null, [Validators.required, Validators.maxLength(500)]),
            dimension: new FormControl<any>(null, [Validators.required]),
            category: new FormControl<Category | null>(null, [Validators.required]),
            subCategories: new FormControl<string[] | null>([]),
            nbTable: new FormControl<number | null>(1, [Validators.min(0)]),
            nbChair: new FormControl<number | null>(2, [Validators.min(0)]),
            needElectricity: new FormControl<boolean | null>(false),
            shared: new FormControl<boolean | null>(false),
            website: new FormControl<string | null>(null, [Validators.maxLength(100)]),
            instagram: new FormControl<string | null>(null, [Validators.maxLength(100)]),
            facebook: new FormControl<string | null>(null, [Validators.maxLength(100)]),
            sharedFirstName: new FormControl<string | null>(null, [Validators.maxLength(100)]),
            sharedLastName: new FormControl<string | null>(null, [Validators.maxLength(100)]),
            sharedTherapistName: new FormControl<string | null>(null, [Validators.maxLength(100)]),
            sharedEmail: new FormControl<string | null>(null, [Validators.email, Validators.maxLength(100)]),
            sharedDescription: new FormControl<string | null>(null, [Validators.maxLength(500)]),
            sharedCategory: new FormControl<Category | null>(null),
            sharedSubCategories: new FormControl<string[] | null>([]),
            sharedWebsite: new FormControl<string | null>(null, [Validators.maxLength(100)]),
            sharedInstagram: new FormControl<string | null>(null, [Validators.maxLength(100)]),
            sharedFacebook: new FormControl<string | null>(null, [Validators.maxLength(100)]),
            pictureUpload: new FormControl<ProcessedImageUpload | null>(null,
                [requiredPictureValidator(() => hasPicture.value)]),
            sharedPictureUpload: new FormControl<ProcessedImageUpload | null>(null),
            hasPicture,
            hasSharedPicture
        });
    }

    createTalkGroup(talk?: {title?: string | null; description?: string | null} | null): TalkFormGroup {
        return new FormGroup({
            title: new FormControl<string | null>(talk?.title ?? null,
                [Validators.required, Validators.maxLength(500)]),
            description: new FormControl<string | null>(talk?.description ?? null,
                [Validators.required, Validators.maxLength(500)])
        });
    }

    private createParticipationGroup(): ParticipationFormGroup {
        return new FormGroup({
            nbMeal1: new FormControl<number | null>(0, [Validators.min(0)]),
            nbMeal2: new FormControl<number | null>(0, [Validators.min(0)]),
            nbMeal3: new FormControl<number | null>(0, [Validators.min(0)]),
            modePaymentMeals: new FormControl<ModePaymentMeals | null>(null),
            invoiceSendingMethod: new FormControl<InvoiceSendingMethod | null>(InvoiceSendingMethod.EMAIL,
                [Validators.required]),
            hasOffer: new FormControl<boolean | null>(false),
            offer: new FormControl<string | null>(null, [Validators.maxLength(500)]),
            additionnalInformation: new FormControl<string | null>(null, [Validators.maxLength(1000)])
        });
    }

    private createConsentsGroup(): ConsentsFormGroup {
        return new FormGroup({
            acceptedChart: new FormControl<boolean | null>(false, [mustBeTrueValidator()]),
            acceptedContract: new FormControl<boolean | null>(false, [mustBeTrueValidator()])
        });
    }

    /**
     * Les chartes ne sont affichées que si le salon a défini leur texte. Lorsqu'une charte est masquée,
     * la case correspondante n'est plus demandée à l'exposant : on la force à `true` (le backend valide
     * `@AssertTrue`) et on retire son validateur.
     */
    applyChartsAvailability(form: RegistrationFormGroup,
                            availability: {chart: boolean; salonChart: boolean}): void {
        const consents = form.controls.consents;
        this.applyChartControl(consents.controls.acceptedContract, availability.chart);
        this.applyChartControl(consents.controls.acceptedChart, availability.salonChart);
        consents.updateValueAndValidity({emitEvent: false});
    }

    private applyChartControl(control: FormControl<boolean | null>, displayed: boolean): void {
        control.setValidators(displayed ? [mustBeTrueValidator()] : []);
        if (!displayed) {
            control.setValue(true, {emitEvent: false});
            control.markAsUntouched();
        }
        control.updateValueAndValidity({emitEvent: false});
    }

    // -------------------- VALIDATEURS CONDITIONNELS --------------------

    private wireConditionalValidators(form: RegistrationFormGroup): void {
        const exhibitor = form.controls.exhibitor;
        const services = form.controls.services;
        const participation = form.controls.participation;

        exhibitor.controls.differentBillingAddress.valueChanges.subscribe(different => {
            const billing = exhibitor.controls.billingAddress;
            billing.setValidators(different ? [requiredAddressValidator({requireFullName: true})] : []);
            if (!different) {
                billing.setValue(null, {emitEvent: false});
            }
            billing.markAsUntouched();
            billing.updateValueAndValidity({emitEvent: false});
        });

        services.controls.wantStand.valueChanges.subscribe(want => {
            this.toggle(services.controls.stand, !!want);
            if (!want) {
                this.resetStand(services.controls.stand);
            }
        });

        services.controls.stand.controls.shared.valueChanges.subscribe(shared => {
            if (!shared) {
                this.clearCoExhibitor(services.controls.stand);
            }
            this.refreshCoExhibitorValidators(services.controls.stand, !!shared);
        });

        services.controls.wantConference.valueChanges.subscribe(want => {
            this.toggle(services.controls.conferences, !!want);
            if (want && services.controls.conferences.length === 0) {
                services.controls.conferences.push(this.createTalkGroup());
            }
            if (!want) {
                services.controls.conferences.clear({emitEvent: false});
            }
        });

        services.controls.wantWorkshop.valueChanges.subscribe(want => {
            this.toggle(services.controls.workshops, !!want);
            if (want && services.controls.workshops.length === 0) {
                services.controls.workshops.push(this.createTalkGroup());
            }
            if (!want) {
                services.controls.workshops.clear({emitEvent: false});
            }
        });

        const refreshMealPayment = (): void => {
            const total = this.totalMeals(form);
            const control = participation.controls.modePaymentMeals;
            control.setValidators(total > 0 ? [Validators.required] : []);
            if (total === 0) {
                control.setValue(null, {emitEvent: false});
            }
            control.updateValueAndValidity({emitEvent: false});
        };

        participation.controls.nbMeal1.valueChanges.subscribe(refreshMealPayment);
        participation.controls.nbMeal2.valueChanges.subscribe(refreshMealPayment);
        participation.controls.nbMeal3.valueChanges.subscribe(refreshMealPayment);

        participation.controls.hasOffer.valueChanges.subscribe(hasOffer => {
            const offer = participation.controls.offer;
            offer.setValidators(hasOffer ? [Validators.required, Validators.maxLength(500)] :
                [Validators.maxLength(500)]);
            if (!hasOffer) {
                offer.setValue(null, {emitEvent: false});
                offer.markAsUntouched();
            }
            offer.updateValueAndValidity({emitEvent: false});
        });
    }

    /** Réinitialise entièrement le stand (prestation repassée sur « Non »). */
    private resetStand(stand: StandFormGroup): void {
        stand.reset({
                        description: null,
                        dimension: null,
                        category: null,
                        subCategories: [],
                        nbTable: 1,
                        nbChair: 2,
                        needElectricity: false,
                        shared: false,
                        website: null,
                        instagram: null,
                        facebook: null,
                        sharedSubCategories: [],
                        pictureUpload: null,
                        sharedPictureUpload: null,
                        hasPicture: false,
                        hasSharedPicture: false
                    }, {emitEvent: false});

        this.refreshCoExhibitorValidators(stand, false);
    }

    /** Les informations du co-exposant ne sont exigées que si le stand est partagé. */
    private refreshCoExhibitorValidators(stand: StandFormGroup, shared: boolean): void {
        const required: [AbstractControl, ValidatorFn[]][] = [
            [stand.controls.sharedFirstName, [Validators.maxLength(100)]],
            [stand.controls.sharedLastName, [Validators.maxLength(100)]],
            [stand.controls.sharedEmail, [Validators.email, Validators.maxLength(100)]],
            [stand.controls.sharedDescription, [Validators.maxLength(500)]],
            [stand.controls.sharedCategory, []]
        ];

        required.forEach(([control, validators]) => {
            control.setValidators(shared ? [Validators.required, ...validators] : validators);
            control.updateValueAndValidity({emitEvent: false});
        });

        stand.controls.sharedPictureUpload.setValidators(
            shared ? [requiredPictureValidator(() => stand.controls.hasSharedPicture.value)] : []);
        stand.controls.sharedPictureUpload.updateValueAndValidity({emitEvent: false});
    }

    /** Remet à zéro toutes les informations du co-exposant (stand plus partagé). */
    private clearCoExhibitor(stand: StandFormGroup): void {
        const sharedControls = [
            stand.controls.sharedFirstName,
            stand.controls.sharedLastName,
            stand.controls.sharedTherapistName,
            stand.controls.sharedEmail,
            stand.controls.sharedDescription,
            stand.controls.sharedCategory,
            stand.controls.sharedWebsite,
            stand.controls.sharedInstagram,
            stand.controls.sharedFacebook,
            stand.controls.sharedPictureUpload
        ];

        sharedControls.forEach(control => {
            control.setValue(null, {emitEvent: false});
            control.markAsUntouched();
        });

        stand.controls.sharedSubCategories.setValue([], {emitEvent: false});
        stand.controls.sharedSubCategories.markAsUntouched();
        stand.controls.hasSharedPicture.setValue(false, {emitEvent: false});
    }

    private toggle(control: AbstractControl, enabled: boolean): void {
        if (enabled) {
            control.enable({emitEvent: false});
        } else {
            control.disable({emitEvent: false});
        }
    }

    totalMeals(form: RegistrationFormGroup): number {
        const participation = form.controls.participation;
        return (participation.controls.nbMeal1.value ?? 0) + (participation.controls.nbMeal2.value ?? 0) +
            (participation.controls.nbMeal3.value ?? 0);
    }

    // -------------------- PAYLOAD --------------------

    /**
     * Construit la charge utile envoyée au serveur.
     * Les prestations répondues « Non » sont exclues, et les champs non pertinents valent null.
     */
    toRegistrationRequest(form: RegistrationFormGroup, captchaToken: string | null): IRegistrationRequest {
        const exhibitor = form.controls.exhibitor.getRawValue();
        const services = form.controls.services;
        const participation = form.controls.participation.getRawValue();
        const consents = form.controls.consents.getRawValue();

        const totalMeals = (participation.nbMeal1 ?? 0) + (participation.nbMeal2 ?? 0) + (participation.nbMeal3 ?? 0);

        const stands: IRegistrationStand[] = [];
        if (services.controls.wantStand.value) {
            const stand = services.controls.stand.getRawValue();
            const shared = !!stand.shared;
            stands.push({
                            description: stand.description ?? '',
                            dimensionId: stand.dimension?.id ?? null,
                            category: stand.category ?? null,
                            subCategories: stand.subCategories ?? [],
                            nbTable: stand.nbTable ?? 0,
                            nbChair: stand.nbChair ?? 0,
                            needElectricity: !!stand.needElectricity,
                            shared,
                            website: stand.website ?? null,
                            instagram: stand.instagram ?? null,
                            facebook: stand.facebook ?? null,
                            sharedFirstName: shared ? stand.sharedFirstName ?? null : null,
                            sharedLastName: shared ? stand.sharedLastName ?? null : null,
                            sharedTherapistName: shared ? stand.sharedTherapistName ?? null : null,
                            sharedEmail: shared ? stand.sharedEmail ?? null : null,
                            sharedDescription: shared ? stand.sharedDescription ?? null : null,
                            sharedCategory: shared ? stand.sharedCategory ?? null : null,
                            sharedSubCategories: shared ? stand.sharedSubCategories ?? [] : [],
                            sharedWebsite: shared ? stand.sharedWebsite ?? null : null,
                            sharedInstagram: shared ? stand.sharedInstagram ?? null : null,
                            sharedFacebook: shared ? stand.sharedFacebook ?? null : null,
                            pictureUpload: toImagePayload(stand.pictureUpload),
                            sharedPictureUpload: shared ? toImagePayload(stand.sharedPictureUpload) : null
                        });
        }

        const toTalks = (array: FormArray<TalkFormGroup>, wanted: boolean): IRegistrationTalk[] => {
            if (!wanted) {
                return [];
            }
            return array.controls.map(group => ({
                title: group.controls.title.value ?? '',
                description: group.controls.description.value ?? ''
            }));
        };

        return {
            exhibitor: {
                firstName: exhibitor.firstName ?? '',
                lastName: exhibitor.lastName ?? '',
                email: exhibitor.email ?? '',
                phoneNumber: exhibitor.phoneNumber ?? null,
                language: exhibitor.language ?? 'fr',
                homeAddress: this.cleanAddress(exhibitor.homeAddress),
                differentBillingAddress: !!exhibitor.differentBillingAddress,
                billingAddress: exhibitor.differentBillingAddress ? this.cleanAddress(exhibitor.billingAddress) : null,
                newsletter: !!exhibitor.newsletter
            },
            participation: {
                therapistName: exhibitor.therapistName ?? null,
                nbMeal1: participation.nbMeal1 ?? 0,
                nbMeal2: participation.nbMeal2 ?? 0,
                nbMeal3: participation.nbMeal3 ?? 0,
                modePaymentMeals: totalMeals > 0 ? participation.modePaymentMeals : null,
                invoiceSendingMethod: participation.invoiceSendingMethod as InvoiceSendingMethod,
                hasOffer: !!participation.hasOffer,
                offer: participation.hasOffer ? participation.offer : null,
                additionnalInformation: participation.additionnalInformation ?? null,
                acceptedChart: !!consents.acceptedChart,
                acceptedContract: !!consents.acceptedContract
            },
            stands,
            conferences: toTalks(services.controls.conferences, !!services.controls.wantConference.value),
            workshops: toTalks(services.controls.workshops, !!services.controls.wantWorkshop.value),
            captchaToken
        };
    }

    /**
     * Pré-remplit le formulaire à partir d'une inscription existante (mode modification).
     */
    patchFromRequest(form: RegistrationFormGroup, request: IRegistrationRequest,
                     dimensions: {id: string}[]): void {
        const stand = request.stands?.[0];

        form.controls.exhibitor.patchValue({
                                               firstName: request.exhibitor.firstName,
                                               lastName: request.exhibitor.lastName,
                                               therapistName: request.participation.therapistName,
                                               email: request.exhibitor.email,
                                               phoneNumber: request.exhibitor.phoneNumber,
                                               homeAddress: request.exhibitor.homeAddress,
                                               differentBillingAddress: request.exhibitor.differentBillingAddress,
                                               billingAddress: request.exhibitor.billingAddress,
                                               language: request.exhibitor.language ?? 'fr',
                                               newsletter: request.exhibitor.newsletter
                                           });

        form.controls.participation.patchValue({
                                                   nbMeal1: request.participation.nbMeal1,
                                                   nbMeal2: request.participation.nbMeal2,
                                                   nbMeal3: request.participation.nbMeal3,
                                                   modePaymentMeals: request.participation.modePaymentMeals,
                                                   invoiceSendingMethod: request.participation.invoiceSendingMethod,
                                                   hasOffer: request.participation.hasOffer,
                                                   offer: request.participation.offer,
                                                   additionnalInformation: request.participation.additionnalInformation
                                               });

        form.controls.consents.patchValue({
                                              acceptedChart: request.participation.acceptedChart,
                                              acceptedContract: request.participation.acceptedContract
                                          });

        const services = form.controls.services;

        services.controls.wantStand.setValue(!!stand);
        if (stand) {
            services.controls.stand.patchValue({
                                                   description: stand.description,
                                                   dimension: dimensions.find(d => d.id === stand.dimensionId) ?? null,
                                                   category: stand.category,
                                                   subCategories: stand.subCategories ?? [],
                                                   nbTable: stand.nbTable,
                                                   nbChair: stand.nbChair,
                                                   needElectricity: stand.needElectricity,
                                                   shared: stand.shared,
                                                   website: stand.website,
                                                   instagram: stand.instagram,
                                                   facebook: stand.facebook,
                                                   sharedFirstName: stand.sharedFirstName,
                                                   sharedLastName: stand.sharedLastName,
                                                   sharedTherapistName: stand.sharedTherapistName,
                                                   sharedEmail: stand.sharedEmail,
                                                   sharedDescription: stand.sharedDescription,
                                                   sharedCategory: stand.sharedCategory,
                                                   sharedSubCategories: stand.sharedSubCategories ?? [],
                                                   sharedWebsite: stand.sharedWebsite,
                                                   sharedInstagram: stand.sharedInstagram,
                                                   sharedFacebook: stand.sharedFacebook,
                                                   hasPicture: !!stand.hasPicture,
                                                   hasSharedPicture: !!stand.hasSharedPicture
                                               });
            this.refreshCoExhibitorValidators(services.controls.stand, !!stand.shared);
            // Une image déjà enregistrée satisfait l'obligation : il faut revalider après le patch.
            services.controls.stand.controls.pictureUpload.updateValueAndValidity({emitEvent: false});
        }

        services.controls.conferences.clear({emitEvent: false});
        (request.conferences ?? []).forEach(talk => services.controls.conferences.push(this.createTalkGroup(talk),
            {emitEvent: false}));
        services.controls.wantConference.setValue((request.conferences ?? []).length > 0);

        services.controls.workshops.clear({emitEvent: false});
        (request.workshops ?? []).forEach(talk => services.controls.workshops.push(this.createTalkGroup(talk),
            {emitEvent: false}));
        services.controls.wantWorkshop.setValue((request.workshops ?? []).length > 0);
    }

    // -------------------- BROUILLON (sessionStorage) --------------------

    /**
     * Valeur brute du formulaire, sérialisable, pour la sauvegarde du brouillon en session.
     *
     * Les images sont volontairement exclues : encodées en base64 (et dupliquées par leur aperçu),
     * elles feraient exploser le quota du sessionStorage et feraient perdre tout le brouillon.
     */
    getRawValue(form: RegistrationFormGroup): RegistrationFormValue {
        const value = form.getRawValue();

        return {
            ...value,
            services: {
                ...value.services,
                stand: {
                    ...value.services.stand,
                    pictureUpload: null,
                    sharedPictureUpload: null
                }
            }
        };
    }

    /**
     * Restaure un brouillon précédemment sauvegardé (mode nouvelle inscription uniquement).
     * Les tableaux (conférences/ateliers) sont reconstruits avant d'appliquer les valeurs, pour que
     * les abonnements existants (activation/désactivation des sous-groupes) réagissent correctement.
     */
    restoreDraft(form: RegistrationFormGroup, draft: RegistrationFormValue): void {
        form.controls.exhibitor.patchValue(draft.exhibitor);

        const services = form.controls.services;
        const draftServices = draft.services;

        services.controls.stand.patchValue(draftServices.stand);
        this.refreshCoExhibitorValidators(services.controls.stand, !!draftServices.stand?.shared);
        services.controls.stand.controls.pictureUpload.updateValueAndValidity({emitEvent: false});

        services.controls.conferences.clear({emitEvent: false});
        (draftServices.conferences ?? []).forEach(talk => services.controls.conferences.push(
            this.createTalkGroup(talk), {emitEvent: false}));

        services.controls.workshops.clear({emitEvent: false});
        (draftServices.workshops ?? []).forEach(talk => services.controls.workshops.push(
            this.createTalkGroup(talk), {emitEvent: false}));

        services.patchValue({
                                 wantStand: draftServices.wantStand,
                                 wantConference: draftServices.wantConference,
                                 wantWorkshop: draftServices.wantWorkshop
                             });

        form.controls.participation.patchValue(draft.participation);
        form.controls.consents.patchValue(draft.consents);
    }

    private cleanAddress(address: IAddress | null): IAddress | null {
        if (!address) {
            return null;
        }
        const {id, ...rest} = address;
        return {...rest, isoCountry: address.isoCountry ?? 'CH'};
    }
}
