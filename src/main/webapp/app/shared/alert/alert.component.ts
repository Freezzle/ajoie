import {Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import {Alert, AlertService} from 'app/core/util/alert.service';

@Component({
    selector: 'jhi-alert',
    templateUrl: './alert.component.html',
    imports: [CommonModule, NgbModule],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AlertComponent implements OnInit, OnDestroy {
    alerts = signal<Alert[]>([]);

    private alertService = inject(AlertService);

    ngOnInit(): void {
        this.alerts.set(this.alertService.get());
    }

    setClasses(alert: Alert): { [key: string]: boolean } {
        const classes = {'jhi-toast': Boolean(alert.toast)};
        if (alert.position) {
            return {...classes, [alert.position]: true};
        }
        return classes;
    }

    ngOnDestroy(): void {
        this.alertService.clear();
    }

    close(alert: Alert): void {
        alert.close?.(this.alerts());
    }
}
