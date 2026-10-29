import {ChangeDetectionStrategy, Component, forwardRef, input, signal} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

/**
 * Sélecteur Oui / Non accessible (`role="radiogroup"`), CVA sur `boolean | null`.
 * Réutilisé par la carte de jour du parcours bénévole.
 */
@Component({
               selector: 'yes-no-box',
               standalone: true,
               changeDetection: ChangeDetectionStrategy.OnPush,
               imports: [TranslatePipe],
               providers: [{
                   provide: NG_VALUE_ACCESSOR,
                   useExisting: forwardRef(() => YesNoBoxComponent),
                   multi: true
               }],
               templateUrl: './yes-no-box.component.html',
               styleUrl: './yes-no-box.component.scss'
           })
export class YesNoBoxComponent implements ControlValueAccessor {
    readonly labelledBy = input<string | null>(null);
    readonly yesKey = input<string>('registration.services.yes');
    readonly noKey = input<string>('registration.services.no');

    readonly value = signal<boolean | null>(null);
    readonly disabled = signal<boolean>(false);

    private onChange: (value: boolean | null) => void = () => undefined;
    private onTouched: () => void = () => undefined;

    writeValue(value: boolean | null): void {
        this.value.set(value ?? null);
    }

    registerOnChange(fn: (value: boolean | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }

    select(value: boolean): void {
        if (this.disabled()) {
            return;
        }
        this.value.set(value);
        this.onChange(value);
        this.onTouched();
    }
}
