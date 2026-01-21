import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Data, ParamMap, Router, RouterModule} from '@angular/router';
import {combineLatest, filter, switchMap, tap} from 'rxjs';

import SharedModule from 'app/shared/shared.module';
import {SortService, sortStateSignal} from 'app/shared/sort';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DEFAULT_SORT_DATA, SORT} from 'app/config/navigation.constants';
import {getFirstExhibitorName, IExhibitor} from '../model/exhibitor.interface';
import {ExhibitorService} from '../service/exhibitor.service';
import {finalize} from 'rxjs/operators';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';
import {Toast} from 'primeng/toast';
import {ConfirmPopup} from 'primeng/confirmpopup';
import {ConfirmDialogService} from '../../../shared/delete-dialog/confirm-dialog.service';
import {TableModule} from 'primeng/table';
import {AlertComponent} from '../../../shared/alert/alert.component';
import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {CardComponent} from '../../../shared/components/card/card.component';
import {IconField} from 'primeng/iconfield';
import {InputIcon} from 'primeng/inputicon';
import {InputText} from 'primeng/inputtext';
import {copyToClipboard} from '../../../core/util/utils';
import {MenuItem} from 'primeng/api';
import {SplitMenuBoxComponent} from '../../../shared/components/split-menu-box/split-menu-box.component';
import {TranslateService} from '@ngx-translate/core';

@Component({
               selector: 'app-exhibitor',
               templateUrl: './exhibitor.component.html',
               imports: [
                   RouterModule,
                   FormsModule,
                   SharedModule,
                   ReactiveFormsModule,
                   ButtonBoxComponent,
                   AlertErrorComponent,
                   Toast,
                   ConfirmPopup,
                   TableModule,
                   AlertComponent,
                   ContentPageComponent,
                   CardComponent,
                   IconField,
                   InputIcon,
                   InputText,
                   SplitMenuBoxComponent
               ]
           })
export class ExhibitorComponent implements OnInit {
    public router = inject(Router);
    sortState = sortStateSignal({});
    isLoading = false;
    exhibitors: IExhibitor[] = [];
    protected activatedRoute = inject(ActivatedRoute);
    protected translateService = inject(TranslateService);
    protected sortService = inject(SortService);
    protected confirmDialogService = inject(ConfirmDialogService);
    protected exhibitorService = inject(ExhibitorService);

    // Menu items for split-menu-box
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
        },
        {
            label: this.translateService.instant('exhibitor.copyNewsletter') as string,
            icon: 'pi pi-copy',
            command: () => this.clipboardNewsLetterExhibitors()
        }
    ];

    // ...existing code...

    ngOnInit(): void {
        combineLatest([this.activatedRoute.queryParamMap, this.activatedRoute.data])
            .pipe(
                tap(([params, data]) => this.fillComponentAttributeFromRoute(params, data)),
                tap(() => {
                    if (!this.exhibitors || this.exhibitors.length === 0) {
                        this.load();
                    }
                })
            )
            .subscribe();
    }

    load(): void {
        this.isLoading = true;

        const queryObject: any = {
            sort: this.sortService.buildSortParam(this.sortState())
        };

        this.exhibitorService
            .query(queryObject)
            .pipe(finalize(() => (this.isLoading = false)))
            .subscribe((result) => {
                this.exhibitors = result.body ?? [];
            });
    }

    refresh(): void {
        this.load();
    }

    delete(htmlElement: HTMLElement, exhibitor: IExhibitor): void {
        this.confirmDialogService.delete(htmlElement, 'exhibitor.delete.question',
                                         {id: getFirstExhibitorName(exhibitor)}
        ).pipe(
            filter(confirmed => confirmed),
            switchMap(() => this.exhibitorService.delete(exhibitor.id)),
            tap(() => this.load()) // Recharge les données
        ).subscribe();
    }

    clipboardNewsLetterExhibitors(): void {
        this.isLoading = true;

        this.exhibitorService.getExhibitorsWithActiveNewsletter()
            .pipe(finalize(() => this.isLoading = false))
            .subscribe(exhibitors => {
                copyToClipboard(exhibitors.map(exhibitor => exhibitor.email).join(','));
            });
    }

    previousState(): void {
        window.history.back();
    }

    protected fillComponentAttributeFromRoute(params: ParamMap, data: Data): void {
        this.sortState.set(
            this.sortService.parseSortParam(params.get(SORT) ?? data[DEFAULT_SORT_DATA])
        );
    }
}
