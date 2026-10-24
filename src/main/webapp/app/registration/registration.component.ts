import {Component, computed, ElementRef, inject, OnInit, signal, ViewChild} from '@angular/core';
import {AbstractControl, FormArray, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {debounceTime} from 'rxjs/operators';

import SharedModule from '../shared/shared.module';
import {ButtonBoxComponent} from '../shared/components/button-box/button-box.component';
import {AlertService} from '../core/util/alert.service';
import {Status} from '../admin/enumerations/status.model';
import {IPublicDimension, IPublicSalonInfo, IRegistrationPrices, IRegistrationRequest} from './registration.model';
import {RegistrationFormGroup, RegistrationFormService} from './registration-form.service';
import {RegistrationDraftStorageService} from './registration-draft-storage.service';
import {RegistrationService} from './registration.service';
import {StepDescriptor, StepProgressComponent, StepState} from './step-progress/step-progress.component';
import {ExhibitorStepComponent} from './steps/exhibitor-step/exhibitor-step.component';
import {ParticipationStepComponent} from './steps/participation-step/participation-step.component';
import {ServicesStepComponent} from './steps/services-step/services-step.component';
import {SummaryStepComponent} from './steps/summary-step/summary-step.component';
import {TurnstileBoxComponent} from './turnstile-box.component';
import {RegistrationCardComponent} from './registration-card/registration-card.component';

const STEPS: StepDescriptor[] = [
    {key: 'exhibitor', shortLabelKey: 'registration.steps.shortExhibitor', labelKey: 'registration.steps.exhibitor'},
    {key: 'services', shortLabelKey: 'registration.steps.shortServices', labelKey: 'registration.steps.services'},
    {
        key: 'participation',
        shortLabelKey: 'registration.steps.shortParticipation',
        labelKey: 'registration.steps.participation'
    },
    {key: 'summary', shortLabelKey: 'registration.steps.shortSummary', labelKey: 'registration.steps.summary'}
];

@Component({
               selector: 'app-registration',
               imports: [
                   SharedModule,
                   ReactiveFormsModule,
                   ButtonBoxComponent,
                   StepProgressComponent,
                   ExhibitorStepComponent,
                   ServicesStepComponent,
                   ParticipationStepComponent,
                   SummaryStepComponent,
                   TurnstileBoxComponent,
                   RegistrationCardComponent
               ],
               templateUrl: './registration.component.html',
               styleUrl: './registration.component.scss'
           })
export default class RegistrationComponent implements OnInit {
    readonly steps = STEPS;

    readonly currentStep = signal<number>(0);
    readonly maxReached = signal<number>(0);
    readonly submitting = signal<boolean>(false);
    readonly submitted = signal<boolean>(false);
    readonly loading = signal<boolean>(true);
    readonly loadError = signal<string | null>(null);
    readonly showStepErrors = signal<boolean>(false);
    readonly salonInfo = signal<IPublicSalonInfo | null>(null);
    readonly captchaEnabled = signal<boolean>(false);
    readonly captchaSiteKey = signal<string>('');
    readonly captchaToken = signal<string | null>(null);
    readonly editMode = signal<boolean>(false);
    readonly started = signal<boolean>(false);
    readonly registrationStatus = signal<Status | null>(null);
    readonly confirmedFirstName = signal<string>('');
    readonly confirmedEmail = signal<string>('');

    /** Recalculé à chaque passage de @if/@for pour refléter l'état courant du formulaire. */
    readonly stepStates = signal<StepState[]>(['cur', 'todo', 'todo', 'todo']);
    readonly stepProgress = signal<number>(0);

    form!: RegistrationFormGroup;

    @ViewChild('stepTitle') stepTitle?: ElementRef<HTMLHeadingElement>;
    @ViewChild(TurnstileBoxComponent) turnstile?: TurnstileBoxComponent;

    private route = inject(ActivatedRoute);
    private registrationService = inject(RegistrationService);
    private formService = inject(RegistrationFormService);
    private draftStorage = inject(RegistrationDraftStorageService);
    private alertService = inject(AlertService);

    private salonId = '';
    private participationId: string | null = null;
    private token: string | null = null;

    readonly isLastStep = computed(() => this.currentStep() === STEPS.length - 1);

    /**
     * Une inscription modifiée revenant via le lien n'est plus modifiable dès qu'elle est sortie
     * du statut "en vérification" : elle doit être consultable en lecture seule uniquement.
     */
    readonly readOnly = computed(() => this.editMode() &&
        this.registrationStatus() !== null && this.registrationStatus() !== Status.IN_VERIFICATION);

    get dimensions(): IPublicDimension[] {
        return this.salonInfo()?.dimensions ?? [];
    }

    get prices(): IRegistrationPrices | null {
        return this.salonInfo()?.prices ?? null;
    }

    get registrationOpen(): boolean {
        return this.editMode() || this.salonInfo()?.registrationOpen === true;
    }

    /** Texte de la charte d'inscription, null si le salon ne l'a pas renseigné (card masquée). */
    get chartText(): string | null {
        return this.cleanHtml(this.salonInfo()?.registrationChartText);
    }

    /** Texte de la charte du salon, null si le salon ne l'a pas renseigné (card masquée). */
    get salonChartText(): string | null {
        return this.cleanHtml(this.salonInfo()?.registrationSalonChartText);
    }

    private cleanHtml(value: string | null | undefined): string | null {
        if (!value) {
            return null;
        }
        // L'éditeur riche enregistre parfois un contenu "vide" (<p><br></p>) : on le considère comme absent.
        const stripped = value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
        return stripped.length > 0 ? value : null;
    }

    private applyChartsAvailability(): void {
        this.formService.applyChartsAvailability(this.form, {
            chart: this.chartText !== null,
            salonChart: this.salonChartText !== null
        });
    }

    ngOnInit(): void {
        this.form = this.formService.createForm();
        this.form.valueChanges.subscribe(() => this.refreshStates());
        this.form.valueChanges.pipe(debounceTime(300)).subscribe(() => this.saveDraft());

        const params = this.route.snapshot.paramMap;
        this.salonId = params.get('salonId') ?? '';
        this.participationId = params.get('participationId');
        this.token = params.get('token');
        this.editMode.set(!!this.participationId && !!this.token);
        this.started.set(this.editMode());

        if (this.editMode()) {
            // Un lien de modification prime sur tout brouillon de nouvelle inscription en cours pour ce salon.
            this.draftStorage.clear(this.salonId);
        }

        this.registrationService.getCaptchaConfig().subscribe({
            next: config => {
                this.captchaEnabled.set(config.enabled && !this.editMode());
                this.captchaSiteKey.set(config.siteKey);
            },
            error: () => this.captchaEnabled.set(false)
        });

        this.registrationService.getSalonInfo(this.salonId).subscribe({
            next: info => {
                this.salonInfo.set(info);
                if (this.editMode()) {
                    this.loadExistingRegistration();
                } else {
                    this.restoreDraftIfAny();
                    this.applyChartsAvailability();
                    this.loading.set(false);
                    this.refreshStates();
                }
            },
            error: (error: HttpErrorResponse) => {
                this.loadError.set(this.extractMessage(error, 'registration.errors.salonNotFound'));
                this.loading.set(false);
            }
        });
    }

    // -------------------- NAVIGATION --------------------

    stepGroup(index: number): AbstractControl {
        switch (index) {
            case 0:
                return this.form.controls.exhibitor;
            case 1:
                return this.form.controls.services;
            case 2:
                return this.form.controls.participation;
            default:
                return this.form.controls.consents;
        }
    }

    startRegistration(): void {
        this.started.set(true);
        this.goTo(0);
    }

    previous(): void {
        if (!this.readOnly() && this.currentStep() > 0) {
            this.goTo(this.currentStep() - 1);
        }
    }

    next(): void {
        if (this.readOnly()) {
            return;
        }

        if (this.isLastStep()) {
            this.submit();
            return;
        }

        if (this.validateStep(this.currentStep())) {
            this.goTo(this.currentStep() + 1);
        }
    }

    /**
     * Clic sur un segment : en arrière on y va directement, en avant on valide chaque étape
     * et on s'arrête sur la première invalide.
     */
    onStepClick(target: number): void {
        if (this.readOnly()) {
            return;
        }

        if (target <= this.currentStep()) {
            this.goTo(target);
            return;
        }

        for (let i = this.currentStep(); i < target; i++) {
            if (!this.validateStep(i)) {
                this.goTo(i);
                return;
            }
        }

        this.goTo(target);
    }

    onEditFromSummary(event: {step: number; anchor?: string}): void {
        if (this.readOnly()) {
            return;
        }

        this.goTo(event.step);
        if (event.anchor) {
            setTimeout(() => document.getElementById(event.anchor as string)?.scrollIntoView({block: 'start'}), 50);
        }
    }

    private goTo(index: number): void {
        this.currentStep.set(index);
        this.maxReached.set(Math.max(this.maxReached(), index));
        this.showStepErrors.set(false);
        this.refreshStates();
        this.saveDraft();

        setTimeout(() => {
            window.scrollTo({top: 0, behavior: 'smooth'});
            this.stepTitle?.nativeElement.focus();
        });
    }

    // -------------------- VALIDATION --------------------

    private validateStep(index: number): boolean {
        const group = this.stepGroup(index);
        group.markAllAsTouched();
        group.updateValueAndValidity();
        this.showStepErrors.set(true);
        this.refreshStates();

        if (group.valid) {
            return true;
        }

        const count = this.countInvalidControls(group);
        this.alertService.addAlert({
                                       type: 'warning',
                                       translationKey: 'registration.errors.fieldsToComplete',
                                       translationParams: {count}
                                   });

        setTimeout(() => this.focusFirstInvalid());
        return false;
    }

    private countInvalidControls(control: AbstractControl): number {
        if (control instanceof FormGroup) {
            const nested = Object.values(control.controls)
                                 .reduce((total, child) => total + this.countInvalidControls(child), 0);
            return nested === 0 && control.invalid ? 1 : nested;
        }
        if (control instanceof FormArray) {
            const nested = control.controls.reduce((total, child) => total + this.countInvalidControls(child), 0);
            return nested === 0 && control.invalid ? 1 : nested;
        }
        return control.invalid ? 1 : 0;
    }

    private focusFirstInvalid(): void {
        const element = document.querySelector<HTMLElement>('.registration-step .ng-invalid:not(form)');
        element?.scrollIntoView({block: 'center'});
        element?.focus?.();
    }

    private refreshStates(): void {
        const current = this.currentStep();
        const maxReached = this.maxReached();

        const states: StepState[] = this.steps.map((_, index) => {
            if (index === current) {
                return 'cur';
            }
            if (index <= maxReached) {
                return this.stepGroup(index).valid ? 'done' : 'warn';
            }
            return 'todo';
        });

        this.stepStates.set(states);
        this.stepProgress.set(this.computeProgress(this.stepGroup(current)));
    }

    private computeProgress(group: AbstractControl): number {
        const leaves = this.collectLeaves(group);
        const pool = leaves.filter(control => control.validator !== null);
        const effective = pool.length > 0 ? pool : leaves;

        if (effective.length === 0) {
            return 100;
        }

        const valid = effective.filter(control => control.valid).length;
        return Math.max(8, Math.round((valid / effective.length) * 100));
    }

    private collectLeaves(control: AbstractControl): AbstractControl[] {
        if (control instanceof FormGroup) {
            return Object.values(control.controls).flatMap(child => this.collectLeaves(child));
        }
        if (control instanceof FormArray) {
            return control.controls.flatMap(child => this.collectLeaves(child));
        }
        return [control];
    }

    // -------------------- CHARGEMENT / ENVOI --------------------

    /** Reprend un brouillon sauvegardé en session (nouvelle inscription uniquement). */
    private restoreDraftIfAny(): void {
        const draft = this.draftStorage.load(this.salonId);
        if (!draft) {
            return;
        }

        this.formService.restoreDraft(this.form, draft.value);
        this.currentStep.set(draft.step);
        this.maxReached.set(draft.maxReached);
        this.started.set(true);
    }

    /** Sauvegarde l'état courant du formulaire en session, pour ne pas tout perdre en cas de mauvaise manipulation. */
    private saveDraft(): void {
        if (this.editMode() || !this.started() || !this.salonId) {
            return;
        }

        this.draftStorage.save(this.salonId, {
            step: this.currentStep(),
            maxReached: this.maxReached(),
            value: this.formService.getRawValue(this.form)
        });
    }

    private loadExistingRegistration(): void {
        this.registrationService.findRegistration(this.salonId, this.participationId as string, this.token as string)
            .subscribe({
                           next: (request: IRegistrationRequest) => {
                               this.registrationStatus.set(request.status ?? null);
                               this.formService.patchFromRequest(this.form, request, this.dimensions);
                               this.applyChartsAvailability();

                               if (this.readOnly()) {
                                   this.form.disable({emitEvent: false});
                               } else {
                                   this.form.controls.exhibitor.controls.email.disable();
                               }

                               this.currentStep.set(STEPS.length - 1);
                               this.maxReached.set(STEPS.length - 1);
                               this.loading.set(false);
                               this.refreshStates();
                           },
                           error: (error: HttpErrorResponse) => {
                               this.loadError.set(this.extractMessage(error, 'registration.errors.linkInvalid'));
                               this.loading.set(false);
                           }
                       });
    }

    submit(): void {
        if (this.readOnly()) {
            return;
        }

        for (let i = 0; i < STEPS.length; i++) {
            if (!this.validateStep(i)) {
                this.goTo(i);
                this.showStepErrors.set(true);
                return;
            }
        }

        if (this.captchaEnabled() && !this.captchaToken()) {
            this.alertService.addAlert({type: 'warning', translationKey: 'registration.errors.captchaRequired'});
            return;
        }

        const payload = this.formService.toRegistrationRequest(this.form, this.captchaToken());
        this.submitting.set(true);

        const request$ = this.editMode() ?
            this.registrationService.updateRegistration(this.salonId, this.participationId as string,
                this.token as string, payload) :
            this.registrationService.register(this.salonId, payload);

        request$.subscribe({
                               next: response => {
                                   this.submitting.set(false);
                                   this.draftStorage.clear(this.salonId);
                                   this.confirmedFirstName.set(response.firstName);
                                   this.confirmedEmail.set(response.email);
                                   this.submitted.set(true);
                                   window.scrollTo({top: 0});
                               },
                               error: (error: HttpErrorResponse) => {
                                   this.submitting.set(false);
                                   this.captchaToken.set(null);
                                   this.turnstile?.reset();
                                   this.alertService.addAlert({
                                                                  type: 'danger',
                                                                  translationKey: this.extractMessage(error,
                                                                      'registration.errors.submitFailed')
                                                              });
                               }
                           });
    }

    onCaptchaToken(token: string | null): void {
        this.captchaToken.set(token);
    }

    private extractMessage(error: HttpErrorResponse, fallbackKey: string): string {
        const message = error?.error?.message;
        return typeof message === 'string' && message.length > 0 ? message : fallbackKey;
    }
}
