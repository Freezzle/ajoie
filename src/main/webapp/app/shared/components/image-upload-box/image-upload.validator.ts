import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

/**
 * Exige une image : soit un nouvel upload, soit une image déjà enregistrée.
 *
 * `hasExistingPicture` est évalué à chaque validation afin de suivre la suppression de l'image
 * existante par l'utilisateur.
 */
export function requiredPictureValidator(hasExistingPicture: () => boolean): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null =>
        control.value || hasExistingPicture() ? null : {required: true};
}
