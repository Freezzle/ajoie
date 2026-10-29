import {Component, input} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {RegistrationCardComponent} from '../../../shared/components/registration-card/registration-card.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {
    SegmentedChoiceBoxComponent,
    SegmentedChoiceOption
} from '../../../shared/components/segmented-choice-box/segmented-choice-box.component';
import {ZoneCard, ZonePickerComponent} from '../../zone-picker/zone-picker.component';
import {PreferencesGroup} from '../../volunteer-registration-form.service';

/** Étape 3 — Préférences : zones et remarques. */
@Component({
               selector: 'app-volunteer-preferences-step',
               standalone: true,
               imports: [ReactiveFormsModule, TranslatePipe, RegistrationCardComponent, TextareaBoxComponent,
                         SegmentedChoiceBoxComponent, ZonePickerComponent],
               templateUrl: './preferences-step.component.html'
           })
export class PreferencesStepComponent {
    readonly form = input.required<PreferencesGroup>();
    readonly zones = input.required<ZoneCard[]>();
    readonly showErrors = input<boolean>(false);

    readonly zoneModeOptions: SegmentedChoiceOption[] = [
        {
            value: 'ANY',
            titleKey: 'volunteerRegistration.preferences.anyTitle',
            subtitleKey: 'volunteerRegistration.preferences.anySubtitle'
        },
        {
            value: 'CHOOSE',
            titleKey: 'volunteerRegistration.preferences.chooseTitle',
            subtitleKey: 'volunteerRegistration.preferences.chooseSubtitle'
        }
    ];

    get mode(): string {
        return this.form().controls.zoneMode.value;
    }

    get zonesInvalid(): boolean {
        return this.showErrors() && this.mode === 'CHOOSE' && this.form().controls.categoryIds.invalid;
    }
}
