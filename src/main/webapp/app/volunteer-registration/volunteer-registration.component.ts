import {Component, computed, ElementRef, inject, OnInit, signal, ViewChild} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';

import SharedModule from '../shared/shared.module';
import {ButtonBoxComponent} from '../shared/components/button-box/button-box.component';
import {RegistrationCardComponent} from '../shared/components/registration-card/registration-card.component';
import {SalonBannerComponent} from '../shared/components/salon-banner/salon-banner.component';
import {StepDescriptor, StepProgressComponent, StepState} from '../shared/components/step-progress/step-progress.component';
import {AlertService} from '../core/util/alert.service';
import {formatSalonDateRange} from '../registration/registration-date-range.util';

import {ContactStepComponent} from './steps/contact-step/contact-step.component';
import {AvailabilityStepComponent} from './steps/availability-step/availability-step.component';
import {PreferencesStepComponent} from './steps/preferences-step/preferences-step.component';
import {SummaryStepComponent} from './steps/summary-step/summary-step.component';
import {VolunteerRegistrationService} from './volunteer-registration.service';
import {VolunteerRegistrationFormGroup, VolunteerRegistrationFormService} from './volunteer-registration-form.service';
import {IPublicVolunteerSalonInfo, VolunteerClosedReason} from './volunteer-registration.model';
import {FriseSlot} from './volunteer-availability.util';
import {ZoneCard} from './zone-picker/zone-picker.component';
import {AvailabilityPreviewComponent, PreviewDay} from './availability-preview/availability-preview.component';
import {buildPreviewDays} from './volunteer-preview.util';
import {shortLabel} from './volunteer-day-format.util';
import RichTextPipe from '../shared/pipe/rich-text.pipe';

const STEPS: StepDescriptor[] = [
    {key: 'contact', shortLabelKey: 'volunteerRegistration.steps.contact.short', labelKey: 'volunteerRegistration.steps.contact.label'},
    {key: 'availability', shortLabelKey: 'volunteerRegistration.steps.availability.short', labelKey: 'volunteerRegistration.steps.availability.label'},
    {key: 'preferences', shortLabelKey: 'volunteerRegistration.steps.preferences.short', labelKey: 'volunteerRegistration.steps.preferences.label'},
    {key: 'summary', shortLabelKey: 'volunteerRegistration.steps.summary.short', labelKey: 'volunteerRegistration.steps.summary.label'}
];

@Component({
  selector: 'app-volunteer-registration',
  standalone: true,
  imports: [
    SharedModule,
    ReactiveFormsModule,
    ButtonBoxComponent,
    RegistrationCardComponent,
    SalonBannerComponent,
    StepProgressComponent,
    ContactStepComponent,
    AvailabilityStepComponent,
    PreferencesStepComponent,
    SummaryStepComponent,
    AvailabilityPreviewComponent,
    RichTextPipe,
  ],
  templateUrl: './volunteer-registration.component.html',
  styleUrl: './volunteer-registration.component.scss',
})
export default class VolunteerRegistrationComponent implements OnInit {
  @ViewChild('stepHeading') stepHeading?: ElementRef<HTMLElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(VolunteerRegistrationService);
  private readonly formService = inject(VolunteerRegistrationFormService);
  private readonly alertService = inject(AlertService);

  readonly steps = STEPS;

  readonly loading = signal<boolean>(true);
  readonly loadError = signal<boolean>(false);
  readonly salonInfo = signal<IPublicVolunteerSalonInfo | null>(null);
  readonly started = signal<boolean>(false);
  readonly submitted = signal<boolean>(false);
  readonly submitting = signal<boolean>(false);

  readonly currentStep = signal<number>(0);
  readonly maxReached = signal<number>(0);
  readonly showStepErrors = signal<boolean>(false);

  readonly captchaEnabled = signal<boolean>(false);
  readonly captchaSiteKey = signal<string>('');
  private captchaToken: string | null = null;

  readonly confirmation = signal<{ firstName: string; email: string } | null>(null);

  form!: VolunteerRegistrationFormGroup;
  slotsByDay: Record<string, FriseSlot[]> = {};
  private salonId = '';

  readonly registrationOpen = computed(() => this.salonInfo()?.registrationOpen === true);
  readonly closedReason = computed<VolunteerClosedReason>(
    () => this.salonInfo()?.closedReason ?? null,
  );

  readonly stepStates = signal<StepState[]>(['cur', 'todo', 'todo', 'todo']);
  readonly stepProgress = signal<number>(0);

  get salonDateRange(): string | null {
    const info = this.salonInfo();
    return info ? formatSalonDateRange(info.startingDate, info.endingDate, 'fr-CH') : null;
  }

  get volunteerName(): string {
    const c = this.form?.controls.contact.getRawValue();
    return c ? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() : '';
  }

  get previewDays(): PreviewDay[] {
    const info = this.salonInfo();
    return info && this.form
      ? buildPreviewDays(info.days, this.form.controls.availability, this.slotsByDay)
      : [];
  }

  ngOnInit(): void {
    this.salonId = this.route.snapshot.paramMap.get('salonId') ?? '';

    this.service.getCaptchaConfig().subscribe({
      next: (cfg) => {
        this.captchaEnabled.set(cfg.enabled);
        this.captchaSiteKey.set(cfg.siteKey);
      },
      error: () => undefined,
    });

    this.service.getSalonInfo(this.salonId).subscribe({
      next: (info) => {
        this.salonInfo.set(info);
        this.form = this.formService.createForm(info.days);
        this.slotsByDay = this.formService.buildSlotsByDay(info.days);
        this.loading.set(false);
        // Démarre directement s'il n'y a pas d'écran d'accueil.
        if (!info.welcomeText && !info.welcomeTitle) {
          this.started.set(true);
        }
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  zoneCards(): ZoneCard[] {
    const info = this.salonInfo();
    if (!info) {
      return [];
    }
    const availableDayIds = this.availableDayIds();
    return info.zones.map((zone) => {
      const daysLabel = zone.dayIds
        .map((id) => {
          const day = info.days.find((d) => d.id === id);
          return day ? shortLabel(day.date, day.label) : '';
        })
        .filter(Boolean)
        .join(', ');
      const hasAnyAvailable = zone.dayIds.some((id) => availableDayIds.includes(id));
      const warning =
        zone.dayIds.length > 0 && !hasAnyAvailable
          ? "Vous n'êtes pas disponible ces jours-là"
          : null;
      return {
        id: zone.id,
        label: zone.label,
        color: zone.color,
        icon: zone.icon,
        description: zone.description,
        daysLabel,
        warning,
      };
    });
  }

  private availableDayIds(): string[] {
    if (!this.form) {
      return [];
    }
    return this.form.controls.availability.controls
      .filter(
        (c) => c.controls.available.value === true && (c.controls.slots.value?.length ?? 0) > 0,
      )
      .map((c) => c.controls.dayId.value);
  }

  // -------------------- NAVIGATION --------------------

  start(): void {
    this.started.set(true);
  }

  onStepClick(target: number): void {
    if (target <= this.maxReached()) {
      this.goTo(target);
    } else {
      this.next();
    }
  }

  previous(): void {
    if (this.currentStep() > 0) {
      this.goTo(this.currentStep() - 1);
    }
  }

  next(): void {
    if (!this.validateStep(this.currentStep())) {
      return;
    }
    if (this.currentStep() < this.steps.length - 1) {
      this.goTo(this.currentStep() + 1);
    }
  }

  private goTo(index: number): void {
    this.currentStep.set(index);
    this.maxReached.set(Math.max(this.maxReached(), index));
    this.showStepErrors.set(false);
    this.refreshStates();
    queueMicrotask(() => this.stepHeading?.nativeElement.focus());
  }

  private validateStep(index: number): boolean {
    const group = this.groupForStep(index);
    group.markAllAsTouched();
    this.showStepErrors.set(true);
    this.refreshStates();
    if (group.invalid) {
      this.alertService.addAlert({
        type: 'warning',
        translationKey: 'volunteerRegistration.errors.incomplete',
      });
      return false;
    }
    return true;
  }

  private groupForStep(index: number) {
    switch (index) {
      case 0:
        return this.form.controls.contact;
      case 1:
        return this.form.controls.availability;
      case 2:
        return this.form.controls.preferences;
      default:
        return this.form.controls.consents;
    }
  }

  private refreshStates(): void {
    const states: StepState[] = this.steps.map((_, i) => {
      if (i === this.currentStep()) {
        return 'cur';
      }
      if (i < this.maxReached()) {
        return this.groupForStep(i).invalid ? 'warn' : 'done';
      }
      return 'todo';
    });
    this.stepStates.set(states);
    this.stepProgress.set(this.computeProgress(this.currentStep()));
  }

  /** Part réglée de l'étape courante (pour le remplissage de la barre). */
  private computeProgress(index: number): number {
    if (index === 1) {
      const controls = this.form.controls.availability.controls;
      if (!controls.length) {
        return 0;
      }
      const settled = controls.filter((c) => c.valid).length;
      return Math.round((settled / controls.length) * 100);
    }
    const group = this.groupForStep(index);
    return group.valid ? 100 : 8;
  }

  // -------------------- SOUMISSION --------------------

  onCaptchaToken(token: string | null): void {
    this.captchaToken = token;
  }

  onEditStep(index: number): void {
    this.goTo(index);
  }

  submit(): void {
    if (!this.validateStep(3) || this.form.invalid) {
      this.form.markAllAsTouched();
      this.showStepErrors.set(true);
      this.alertService.addAlert({
        type: 'warning',
        translationKey: 'volunteerRegistration.errors.incomplete',
      });
      return;
    }

    const request = this.formService.toRequest(this.form, this.slotsByDay, this.captchaToken);
    this.submitting.set(true);
    this.service.register(this.salonId, request).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.confirmation.set({ firstName: res.firstName, email: res.email });
        this.submitted.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        const key = err.error?.message ?? 'volunteerRegistration.errors.server';
        this.alertService.addAlert({ type: 'danger', translationKey: key, message: key });
      },
    });
  }
}
