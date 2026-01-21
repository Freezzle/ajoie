import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {filter, switchMap, tap} from 'rxjs';

import SharedModule from 'app/shared/shared.module';
import {FormatMediumDatePipe} from 'app/shared/date';
import {FormsModule} from '@angular/forms';
import {ISalon} from '../model/salon.interface';
import {SalonService} from '../service/salon.service';
import {finalize} from 'rxjs/operators';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';
import {AlertComponent} from '../../../shared/alert/alert.component';
import {ConfirmDialogService} from '../../../shared/delete-dialog/confirm-dialog.service';
import {ConfirmPopup} from 'primeng/confirmpopup';
import {Toast} from 'primeng/toast';
import {TableModule} from 'primeng/table';
import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {CardComponent} from '../../../shared/components/card/card.component';
import {IconField} from 'primeng/iconfield';
import {InputIcon} from 'primeng/inputicon';
import {InputText} from 'primeng/inputtext';
import {SplitMenuBoxComponent} from '../../../shared/components/split-menu-box/split-menu-box.component';
import {TranslateService} from '@ngx-translate/core';
import {MenuItem} from 'primeng/api';

@Component({
               selector: 'app-salon',
               templateUrl: './salon.component.html',
               imports: [
                   RouterModule,
                   FormsModule,
                   SharedModule,
                   FormatMediumDatePipe,
                   ButtonBoxComponent,
                   AlertErrorComponent,
                   AlertComponent,
                   ConfirmPopup,
                   Toast,
                   TableModule,
                   ContentPageComponent,
                   CardComponent,
                   IconField,
                   InputIcon,
                   InputText,
                   SplitMenuBoxComponent
               ]
           })
export class SalonComponent implements OnInit {
    public router = inject(Router);
    salons: ISalon[] = [];
    isLoading = false;
    protected salonService = inject(SalonService);
    protected activatedRoute = inject(ActivatedRoute);
    protected translateService = inject(TranslateService);
    protected confirmDialogService = inject(ConfirmDialogService);

    ngOnInit(): void {
        if (!this.salons || this.salons.length === 0) {
            this.load();
        }
    }

    delete(htmlElement: HTMLElement, salon: ISalon): void {
        this.confirmDialogService.delete(htmlElement, 'salon.delete.question', {id: salon.place}).pipe(
            filter(confirmed => confirmed),
            switchMap(() => this.salonService.delete(salon.id)),
            tap(() => this.load()) // Recharge les données
        ).subscribe();
    }

    load(): void {
        this.isLoading = true;

        this.salonService
            .query()
            .pipe(finalize(() => (this.isLoading = false)))
            .subscribe((result) => {
                this.salons = result.body ?? [];
            });
    }

    readonly actionMenuItems: MenuItem[] = [
        {
            label: this.translateService.instant('common.refresh') as string,
            icon: 'pi pi-sync',
            command: () => this.load()
        },
        {
            label: this.translateService.instant('common.create') as string,
            icon: 'pi pi-plus',
            command: () => this.router.navigate(['./new'], {relativeTo: this.activatedRoute})
        }
    ];

    previousState(): void {
        window.history.back();
    }
}
