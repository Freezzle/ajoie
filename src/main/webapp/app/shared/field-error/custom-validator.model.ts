import {AbstractControl, ValidationErrors} from "@angular/forms";

export class CustomValidatorModel {
    public static onlyNumbers(control: AbstractControl): ValidationErrors | null  {
        const value = control.value;
        const regex = /^[0-9]*$/;

        if (value && !regex.test(value)) {
            return { onlyNumbers: true };
        }
        return null;
    }
}