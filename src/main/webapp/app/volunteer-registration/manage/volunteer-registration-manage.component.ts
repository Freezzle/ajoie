import {Component, computed, ElementRef, HostListener, inject, OnInit, signal, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';

import SharedModule from '../../shared/shared.module';
import {ButtonBoxComponent} from '../../shared/components/button-box/button-box.component';
import {SalonBannerComponent} from '../../shared/components/salon-banner/salon-banner.component';
import {AlertService} from '../../core/util/alert.service';
import {formatSalonDateRange} from '../../registration/registration-date-range.util';

import {ContactStepComponent} from '../steps/contact-step/contact-step.component';
import {AvailabilityStepComponent} from '../steps/availability-step/availability-step.component';
import {PreferencesStepComponent} from '../steps/preferences-step/preferences-step.component';
import {AvailabilityPreviewComponent, PreviewDay} from '../availability-preview/availability-preview.component';
import {VolunteerRegistrationService} from '../volunteer-registration.service';
import {VolunteerRegistrationFormGroup, VolunteerRegistrationFormService} from '../volunteer-registration-form.service';
import {
    IPublicVolunteerSalonInfo,
    IVolunteerRegistration,
    IVolunteerRegistrationRequest
} from '../volunteer-registration.model';
import {FriseSlot} from '../volunteer-availability.util';
import {ZoneCard} from '../zone-picker/zone-picker.component';
import {buildDaySummaryLines, buildPreviewDays, DaySummaryLine} from '../volunteer-preview.util';
import {shortLabel} from '../volunteer-day-format.util';

type Section = 'contact' | 'availability' | 'preferences';

@Component({
               selector: 'app-volunteer-registration-manage',
               standalone: true,
               imports: [
                   SharedModule,
                   ButtonBoxComponent,
                   SalonBannerComponent,
                   ContactStepComponent,
                   AvailabilityStepComponent,
                   PreferencesStepComponent,
                   AvailabilityPreviewComponent
               ],
               templateUrl: './volunteer-registration-manage.component.html',
               styleUrl: './volunteer-registration-manage.component.scss'
           })
export default class VolunteerRegistrationManageComponent implements OnInit {
    @ViewChild('heading') heading?: ElementRef<HTMLElement>;

    private readonly route = inject(ActivatedRoute);
    private readonly service = inject(VolunteerRegistrationService);
    private readonly formService = inject(VolunteerRegistrationFormService);
    private readonly alertService = inject(AlertService);

    readonly loading = signal<boolean>(true);
    readonly loadError = signal<string | null>(null);
    readonly salonInfo = signal<IPublicVolunteerSalonInfo | null>(null);
    readonly registration = signal<IVolunteerRegistration | null>(null);
    readonly editable = signal<boolean>(false);
    readonly editingSection = signal<Section | null>(null);
    readonly showStepErrors = signal<boolean>(false);
    readonly sending = signal<boolean>(false);
    readonly justSent = signal<boolean>(false);
    readonly cancelled = signal<boolean>(false);

    form!: VolunteerRegistrationFormGroup;
    slotsByDay: Record<string, FriseSlot[]> = {};
    private salonId = '';
    private registrationId = '';
    private token = '';
    private sentValue: IVolunteerRegistrationRequest | null = null;
    private editBackup: unknown = null;

    readonly changedSections = signal<Set<Section>>(new Set());

    get salonDateRange(): string | null {
        const info = this.salonInfo();
        return info ? formatSalonDateRange(info.startingDate, info.endingDate, 'fr-CH') : null;
    }

    get name(): string {
        const c = this.form?.controls.contact.getRawValue();
        return c ? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() : '';
    }

    get previewDays(): PreviewDay[] {
        const info = this.salonInfo();
        return info && this.form ? buildPreviewDays(info.days, this.form.controls.availability, this.slotsByDay) : [];
    }

    get daySummaryLines(): DaySummaryLine[] {
        const info = this.salonInfo();
        return info && this.form
            ? buildDaySummaryLines(info.days, this.form.controls.availability, this.slotsByDay, 'Pas disponible')
            : [];
    }

    get zoneLabels(): string {
        const info = this.salonInfo();
        const ids: string[] = this.form?.controls.preferences.controls.categoryIds.value ?? [];
        return info ? info.zones.filter(z => ids.includes(z.id)).map(z => z.label).join(', ') : '';
    }

    get zoneMode(): string {
        return this.form?.controls.preferences.controls.zoneMode.value ?? 'ANY';
    }

    get notes(): string | null {
        return this.form?.controls.preferences.controls.notes.value ?? null;
    }

    get phoneDisplay(): string {
        return this.form?.controls.contact.controls.phoneNumber.value || '—';
    }

    readonly hasChanges = computed(() => this.changedSections().size > 0);

    ngOnInit(): void {
        const params = this.route.snapshot.paramMap;
        this.salonId = params.get('salonId') ?? '';
        this.registrationId = params.get('registrationId') ?? '';
        this.token = params.get('token') ?? '';

        this.service.getSalonInfo(this.salonId).subscribe({
            next: info => {
                this.salonInfo.set(info);
                this.form = this.formService.createForm(info.days);
                this.slotsByDay = this.formService.buildSlotsByDay(info.days);
                this.loadRegistration();
            },
            error: () => {
                this.loading.set(false);
                this.loadError.set('volunteerRegistration.manage.linkInvalid');
            }
        });
    }

    private loadRegistration(): void {
        this.service.findRegistration(this.salonId, this.registrationId, this.token).subscribe({
            next: reg => {
                this.registration.set(reg);
                this.editable.set(reg.editable && reg.status !== 'REMOVED');
                this.cancelled.set(reg.status === 'CANCELLED');
                this.formService.patchFromRegistration(this.form, reg, this.slotsByDay);
                this.form.controls.contact.controls.email.disable();
                this.sentValue = this.currentRequest();
                this.loading.set(false);
                if (reg.status === 'REMOVED') {
                    this.loadError.set('volunteerRegistration.manage.removed');
                }
            },
            error: (err: HttpErrorResponse) => {
                this.loading.set(false);
                this.loadError.set(err.status === 410 ? 'volunteerRegistration.manage.removed'
                    : 'volunteerRegistration.manage.linkInvalid');
            }
        });
    }

    zoneCards(): ZoneCard[] {
        const info = this.salonInfo();
        if (!info) {
            return [];
        }
        const availableDayIds = this.form.controls.availability.controls
            .filter(c => c.controls.available.value === true && (c.controls.slots.value?.length ?? 0) > 0)
            .map(c => c.controls.dayId.value);
        return info.zones.map(zone => {
            const daysLabel = zone.dayIds
                .map(id => {
                    const day = info.days.find(d => d.id === id);
                    return day ? shortLabel(day.date, day.label) : '';
                })
                .filter(Boolean)
                .join(', ');
            const warning = zone.dayIds.length > 0 && !zone.dayIds.some(id => availableDayIds.includes(id))
                ? 'Vous n\'êtes pas disponible ces jours-là'
                : null;
            return {
                id: zone.id, label: zone.label, color: zone.color, icon: zone.icon,
                description: zone.description, daysLabel, warning
            };
        });
    }

    // -------------------- EDITION PAR SECTION --------------------

    isSectionChanged(section: Section): boolean {
        return this.changedSections().has(section);
    }

    edit(section: Section): void {
        this.editBackup = this.sectionRawValue(section);
        this.editingSection.set(section);
        this.showStepErrors.set(false);
        queueMicrotask(() => this.heading?.nativeElement.focus());
    }

    cancelEdit(): void {
        const section = this.editingSection();
        if (section) {
            this.restoreSection(section, this.editBackup);
        }
        this.editingSection.set(null);
    }

    validateEdit(): void {
        const section = this.editingSection();
        if (!section) {
            return;
        }
        const group = this.groupForSection(section);
        group.markAllAsTouched();
        if (group.invalid) {
            this.showStepErrors.set(true);
            return;
        }
        if (JSON.stringify(this.sectionRawValue(section)) === JSON.stringify(this.editBackup)) {
            this.alertService.addAlert({type: 'info', translationKey: 'volunteerRegistration.manage.noChange'});
        } else {
            this.alertService.addAlert({type: 'info', translationKey: 'volunteerRegistration.manage.changeReady'});
        }
        this.recomputeChanges();
        this.editingSection.set(null);
    }

    private recomputeChanges(): void {
        const sent = this.sentValue;
        const current = this.currentRequest();
        const changed = new Set<Section>();
        if (sent) {
            if (JSON.stringify(sent.contact) !== JSON.stringify(current.contact)) {
                changed.add('contact');
            }
            if (JSON.stringify(sent.availability) !== JSON.stringify(current.availability)) {
                changed.add('availability');
            }
            if (JSON.stringify(sent.preferences) !== JSON.stringify(current.preferences)) {
                changed.add('preferences');
            }
        }
        this.changedSections.set(changed);
    }

    // -------------------- ENVOI --------------------

    sendChanges(): void {
        const request = this.currentRequest();
        this.sending.set(true);
        this.service.updateRegistration(this.salonId, this.registrationId, this.token, request).subscribe({
            next: () => {
                this.sending.set(false);
                this.sentValue = request;
                this.changedSections.set(new Set());
                this.cancelled.set(false);
                this.justSent.set(true);
            },
            error: (err: HttpErrorResponse) => {
                this.sending.set(false);
                if (err.error?.message === 'error.volunteer-registration.closed') {
                    this.editable.set(false);
                }
                this.alertService.addAlert({
                    type: 'danger',
                    translationKey: err.error?.message ?? 'volunteerRegistration.errors.server',
                    message: err.error?.message ?? 'volunteerRegistration.errors.server'
                });
            }
        });
    }

    discardChanges(): void {
        if (this.sentValue) {
            this.formService.patchFromRegistration(this.form, this.toRegistration(this.sentValue), this.slotsByDay);
            this.changedSections.set(new Set());
        }
    }

    unsubscribe(): void {
        this.discardChanges();
        this.service.cancel(this.salonId, this.registrationId, this.token).subscribe({
            next: () => {
                this.cancelled.set(true);
                this.justSent.set(false);
            },
            error: () => this.alertService.addAlert({type: 'danger', translationKey: 'volunteerRegistration.errors.server'})
        });
    }

    resubscribe(): void {
        const request = this.sentValue ?? this.currentRequest();
        this.service.updateRegistration(this.salonId, this.registrationId, this.token, request).subscribe({
            next: () => {
                this.cancelled.set(false);
                this.sentValue = request;
                this.changedSections.set(new Set());
            },
            error: () => this.alertService.addAlert({type: 'danger', translationKey: 'volunteerRegistration.errors.server'})
        });
    }

    @HostListener('window:beforeunload', ['$event'])
    onBeforeUnload(event: BeforeUnloadEvent): void {
        if (this.hasChanges()) {
            event.preventDefault();
            event.returnValue = '';
        }
    }

    // -------------------- HELPERS --------------------

    private currentRequest(): IVolunteerRegistrationRequest {
        return this.formService.toRequest(this.form, this.slotsByDay, null);
    }

    private toRegistration(request: IVolunteerRegistrationRequest): IVolunteerRegistration {
        return {...request, status: 'ACTIVE', editable: this.editable(), registrationClosingDate: null};
    }

    private groupForSection(section: Section) {
        switch (section) {
            case 'contact':
                return this.form.controls.contact;
            case 'availability':
                return this.form.controls.availability;
            default:
                return this.form.controls.preferences;
        }
    }

    private sectionRawValue(section: Section): unknown {
        return structuredClone(this.groupForSection(section).getRawValue());
    }

    private restoreSection(section: Section, value: unknown): void {
        this.groupForSection(section).reset(value as never);
    }
}
