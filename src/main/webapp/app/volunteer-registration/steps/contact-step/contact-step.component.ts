import {Component, input} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {RegistrationCardComponent} from '../../../shared/components/registration-card/registration-card.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {ContactGroup} from '../../volunteer-registration-form.service';

/** Étape 1 — Vous : coordonnées du bénévole. */
@Component({
               selector: 'app-volunteer-contact-step',
               standalone: true,
               imports: [ReactiveFormsModule, TranslatePipe, RegistrationCardComponent, TextBoxComponent],
               templateUrl: './contact-step.component.html'
           })
export class ContactStepComponent {
    readonly form = input.required<ContactGroup>();
    readonly emailLocked = input<boolean>(false);
}
