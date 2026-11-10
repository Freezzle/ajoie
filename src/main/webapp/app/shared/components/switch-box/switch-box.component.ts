import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

export interface SwitchBoxOption {
    value: string;
    labelKey: string;
    /** Icône PrimeIcons optionnelle, affichée avant le libellé. */
    icon?: string;
    /** Compteur optionnel, affiché en badge après le libellé. */
    count?: number;
}

/** Sélecteur segmenté : une option active parmi plusieurs, avec icône ou compteur. */
@Component({
               selector: 'switch-box',
               standalone: true,
               imports: [TranslatePipe],
               templateUrl: './switch-box.component.html',
               styleUrl: './switch-box.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class SwitchBoxComponent {
    readonly options = input.required<SwitchBoxOption[]>();
    readonly value = input<string | null>(null);
    /** Occupe toute la largeur disponible, les options se partageant l'espace à parts égales. */
    readonly fullWidth = input<boolean>(false);
    readonly isDisabled = input<boolean>(false);

    readonly valueChange = output<string>();

    select(option: SwitchBoxOption): void {
        if (this.isDisabled() || option.value === this.value()) {
            return;
        }
        this.valueChange.emit(option.value);
    }

    onKeydown(event: KeyboardEvent): void {
        if (this.isDisabled() || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) {
            return;
        }
        event.preventDefault();
        const options = this.options();
        const current = Math.max(0, options.findIndex(option => option.value === this.value()));
        const delta = event.key === 'ArrowRight' ? 1 : -1;
        this.select(options[(current + delta + options.length) % options.length]);
    }
}
