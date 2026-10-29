import {Component, EventEmitter, input, Output} from '@angular/core';
import {FormArray, ReactiveFormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {CheckboxBoxComponent} from '../../../shared/components/checkbox-box/checkbox-box.component';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {TurnstileBoxComponent} from '../../../registration/turnstile-box.component';
import {AvailabilityPreviewComponent} from '../../availability-preview/availability-preview.component';
import {ContactGroup, ConsentsGroup, DayGroup, PreferencesGroup} from '../../volunteer-registration-form.service';
import {FriseSlot} from '../../volunteer-availability.util';
import {IPublicVolunteerDay, IPublicVolunteerZone} from '../../volunteer-registration.model';
import {buildDaySummaryLines, buildPreviewDays, DaySummaryLine} from '../../volunteer-preview.util';
import {PreviewDay} from '../../availability-preview/availability-preview.component';

/** Étape 4 — Récapitulatif : relecture, consentement et captcha. */
@Component({
               selector: 'app-volunteer-summary-step',
               standalone: true,
               imports: [ReactiveFormsModule, TranslatePipe, CheckboxBoxComponent,
                         ButtonBoxComponent, TurnstileBoxComponent, AvailabilityPreviewComponent],
               templateUrl: './summary-step.component.html',
               styleUrl: './summary-step.component.scss'
           })
export class SummaryStepComponent {
    readonly contact = input.required<ContactGroup>();
    readonly availability = input.required<FormArray<DayGroup>>();
    readonly preferences = input.required<PreferencesGroup>();
    readonly consents = input.required<ConsentsGroup>();
    readonly days = input.required<IPublicVolunteerDay[]>();
    readonly slotsByDay = input.required<Record<string, FriseSlot[]>>();
    readonly zones = input.required<IPublicVolunteerZone[]>();
    readonly closingDate = input<string | null>(null);
    readonly captchaEnabled = input<boolean>(false);
    readonly captchaSiteKey = input<string>('');

    @Output() editStep = new EventEmitter<number>();
    @Output() captchaToken = new EventEmitter<string | null>();

    get name(): string {
        const c = this.contact().getRawValue();
        return `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
    }

    get phoneDisplay(): string {
        return this.contact().controls.phoneNumber.value || '—';
    }

    get previewDays(): PreviewDay[] {
        return buildPreviewDays(this.days(), this.availability(), this.slotsByDay());
    }

    get daySummaryLines(): DaySummaryLine[] {
        return buildDaySummaryLines(this.days(), this.availability(), this.slotsByDay(), 'Pas disponible');
    }

    get zoneMode(): string {
        return this.preferences().controls.zoneMode.value;
    }

    get zoneLabels(): string {
        const ids: string[] = this.preferences().controls.categoryIds.value ?? [];
        return this.zones().filter(z => ids.includes(z.id)).map(z => z.label).join(', ');
    }

    get notes(): string | null {
        return this.preferences().controls.notes.value;
    }
}
