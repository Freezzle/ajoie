import {ChangeDetectionStrategy, Component, computed, effect, inject, signal} from '@angular/core';
import {DatePipe} from '@angular/common';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {ConfirmationService} from 'primeng/api';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';

import {VolunteerPlanningStore} from '../volunteer-planning.store';
import {AlertService} from '../../../../core/util/alert.service';
import {DialogBoxComponent} from '../../../../shared/components/dialog-box/dialog-box.component';
import {ButtonBoxComponent} from '../../../../shared/components/button-box/button-box.component';
import {
    AdminVolunteerRegistration,
    VolunteerRegistrationAdminService
} from '../../volunteer-registration-admin.service';

/**
 * Popin admin affichant les informations transmises en ligne par un bénévole, avec les actions
 * « Renvoyer le lien » et « Retirer l'inscription ». Ouverte depuis l'icône info du planning.
 */
@Component({
               selector: 'volunteer-info-dialog',
               standalone: true,
               changeDetection: ChangeDetectionStrategy.OnPush,
               imports: [DialogBoxComponent, ButtonBoxComponent, ConfirmDialogModule, TranslatePipe, DatePipe],
               providers: [ConfirmationService],
               templateUrl: './volunteer-info-dialog.component.html'
           })
export class VolunteerInfoDialogComponent {
    protected readonly store = inject(VolunteerPlanningStore);
    private readonly service = inject(VolunteerRegistrationAdminService);
    private readonly alertService = inject(AlertService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly translate = inject(TranslateService);

    readonly loading = signal<boolean>(false);
    readonly registration = signal<AdminVolunteerRegistration | null>(null);
    readonly actionLoading = signal<boolean>(false);

    readonly visible = computed(() => this.store.infoVolunteerId() !== null);

    readonly availabilityLines = computed(() => {
        const reg = this.registration();
        if (!reg) {
            return [];
        }
        const days = this.store.planning().days;
        return days.map(day => {
            const avail = reg.availability.find(a => a.dayId === day.id);
            const label = day.date || day.label;
            if (!avail || !avail.available || avail.ranges.length === 0) {
                return {label, value: this.translate.instant('planningVolunteers.onlineInfo.notAvailable')};
            }
            return {label, value: avail.ranges.map(r => `${r.start}–${r.end}`).join(', ')};
        });
    });

    readonly zoneLabels = computed(() => {
        const reg = this.registration();
        if (!reg || reg.zoneMode === 'ANY') {
            return null;
        }
        const categories = this.store.planning().categories;
        return reg.categoryIds
            .map(id => categories.find(c => c.id === id)?.label ?? id)
            .join(', ');
    });

    constructor() {
        effect(() => {
            const volunteerId = this.store.infoVolunteerId();
            if (volunteerId) {
                this.fetch(volunteerId);
            } else {
                this.registration.set(null);
            }
        });
    }

    private fetch(planningVolunteerId: string): void {
        this.loading.set(true);
        this.registration.set(null);
        this.service.getByPlanningVolunteerId(this.store.salonId, planningVolunteerId)
            .subscribe({
                next: reg => {
                    this.registration.set(reg ?? null);
                    this.loading.set(false);
                },
                error: () => this.loading.set(false)
            });
    }

    close(): void {
        this.store.closeVolunteerInfo();
    }

    resendLink(): void {
        const reg = this.registration();
        if (!reg) {
            return;
        }
        this.actionLoading.set(true);
        this.service.resendLink(this.store.salonId, reg.id).subscribe({
            next: () => {
                this.actionLoading.set(false);
                this.alertService.addAlert({type: 'success', translationKey: 'planningVolunteers.onlineInfo.linkSent'});
            },
            error: () => this.actionLoading.set(false)
        });
    }

    confirmRemove(): void {
        const reg = this.registration();
        if (!reg) {
            return;
        }
        this.confirmationService.confirm({
            message: this.translate.instant('planningVolunteers.onlineInfo.removeConfirm'),
            accept: () => this.remove(reg.id)
        });
    }

    private remove(registrationId: string): void {
        this.actionLoading.set(true);
        this.service.remove(this.store.salonId, registrationId).subscribe({
            next: () => {
                this.actionLoading.set(false);
                this.alertService.addAlert({type: 'success', translationKey: 'planningVolunteers.onlineInfo.removed'});
                this.close();
                // Recharge le planning (le bénévole a été retiré) et la liste des inscrits en ligne.
                this.store.load(this.store.salonId);
            },
            error: () => this.actionLoading.set(false)
        });
    }
}
