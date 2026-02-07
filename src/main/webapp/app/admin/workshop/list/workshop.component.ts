import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap, Router, RouterModule} from '@angular/router';
import {combineLatest, filter, switchMap, tap} from 'rxjs';

import SharedModule from 'app/shared/shared.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {IWorkshop} from '../model/workshop.interface';
import {WorkshopService} from '../service/workshop.service';
import StatusPipe from '../../../shared/pipe/status.pipe';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import {Status} from '../../enumerations/status.model';
import {finalize, map} from 'rxjs/operators';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {getFormattedParticipationName} from '../../participation/model/participation.interface';
import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';
import {ConfirmPopup} from 'primeng/confirmpopup';

import {ConfirmDialogService} from '../../../shared/delete-dialog/confirm-dialog.service';

import {TableModule} from 'primeng/table';
import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {CardComponent} from '../../../shared/components/card/card.component';
import {IconField} from 'primeng/iconfield';
import {InputIcon} from 'primeng/inputicon';
import {InputText} from 'primeng/inputtext';
import {MultiSelect} from 'primeng/multiselect';
import {SplitMenuBoxComponent} from '../../../shared/components/split-menu-box/split-menu-box.component';
import {MenuItem} from 'primeng/api';
import {TranslateService} from '@ngx-translate/core';

@Component({
               selector: 'app-workshop',
               templateUrl: './workshop.component.html',
               imports: [
                   RouterModule,
                   FormsModule,
                   SharedModule,
                   StatusPipe,
                   ColorStatusPipe,
                   ReactiveFormsModule,
                   ButtonBoxComponent,
                   AlertErrorComponent,
                   ConfirmPopup,
                   
                   
                   TableModule,
                   ContentPageComponent,
                   CardComponent,
                   IconField,
                   InputIcon,
                   InputText,
                   MultiSelect,
                   SplitMenuBoxComponent
               ]
           })
export class WorkshopComponent implements OnInit {
    workshops: IWorkshop[] = [];
    isLoading = false;
    params!: ParamMap;
    statusValues = Object.keys(Status);
    protected activatedRoute = inject(ActivatedRoute);
    protected router = inject(Router);
    protected translateService = inject(TranslateService);
    protected confirmDialogService = inject(ConfirmDialogService);
    protected workshopService = inject(WorkshopService);
    protected readonly getFormattedParticipationName = getFormattedParticipationName;

    ngOnInit(): void {
        combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(
            ([params, data]) => {
                this.params = params;

                if (!this.workshops || this.workshops.length === 0) {
                    this.load();
                }
            }
        );
    }

    delete(htmlElement: HTMLElement, workshop: IWorkshop): void {
        this.confirmDialogService.delete(htmlElement, 'workshop.delete.question', {title: workshop.title})
            .pipe(
                filter(confirmed => confirmed),
                switchMap(() => this.workshopService.delete(workshop.id)),
                tap(() => this.load())
            )
            .subscribe();
    }

    load(): void {
        this.isLoading = true;

        const queryObject: any = {
            idSalon: this.params.get('idSalon'),
            idParticipation: this.params.get('idParticipation')
        };

        this.workshopService
            .query(queryObject)
            .pipe(map(workshops => workshops.map(workshop => ({
                          ...workshop,
                          fullNameFilter: getFormattedParticipationName(workshop.participation)
                      }))
                  ),
                  finalize(() => (this.isLoading = false)))
            .subscribe((result) => {
                this.workshops = result ?? [];
            });
    }

    refresh(): void {
        this.load();
    }

    readonly actionMenuItems: MenuItem[] = [
        {
            label: this.translateService.instant('common.refresh') as string,
            icon: 'pi pi-sync',
            command: () => this.refresh()
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
