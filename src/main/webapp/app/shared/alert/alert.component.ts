import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {MessageService} from 'primeng/api';
import {ToastModule} from 'primeng/toast';
import {Subscription} from 'rxjs';

import {Alert, AlertService} from 'app/core/util/alert.service';

@Component({
               selector: 'app-alert',
               templateUrl: './alert.component.html',
               imports: [ToastModule],
               standalone: true
           })
export class AlertComponent implements OnInit, OnDestroy {
    private alertService = inject(AlertService);
    private messageService = inject(MessageService);
    private subscription?: Subscription;

    ngOnInit(): void {
        // S'abonner aux nouvelles alertes
        this.subscription = this.alertService.onAlert().subscribe(alert => {
            this.showToast(alert);
        });

        // Afficher les alertes existantes au chargement
        const existingAlerts = this.alertService.get();
        existingAlerts.forEach(alert => this.showToast(alert));
    }

    private showToast(alert: Alert): void {
        this.messageService.add({
                                    severity: this.mapAlertTypeToSeverity(alert.type),
                                    summary: this.getAlertSummary(alert.type),
                                    detail: alert.message ?? '',
                                    life: alert.timeout ?? 5000,
                                    key: this.normalizePosition('top center')
                                });
    }

    private mapAlertTypeToSeverity(type: string): 'success' | 'info' | 'warn' | 'error' {
        const mapping: Record<string, 'success' | 'info' | 'warn' | 'error'> = {
            'success': 'success',
            'danger': 'error',
            'warning': 'warn',
            'info': 'info'
        };
        return mapping[type] ?? 'info';
    }

    private getAlertSummary(type: string): string {
        const summaries: Record<string, string> = {
            'success': 'Succès',
            'danger': 'Erreur',
            'warning': 'Attention',
            'info': 'Information'
        };
        return summaries[type] || 'Notification';
    }

    private normalizePosition(position: string): string {
        // Convertir "top right" en "top-right" pour PrimeNG
        return position.replace(/ /g, '-');
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
        this.messageService.clear();
        this.alertService.clear();
    }
}
