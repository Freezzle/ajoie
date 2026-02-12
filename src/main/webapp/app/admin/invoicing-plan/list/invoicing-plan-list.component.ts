import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap, Router, RouterModule} from '@angular/router';
import {combineLatest} from 'rxjs';

import SharedModule from 'app/shared/shared.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {IInvoicingPlanList} from '../../participation/model/invoicing-plan.interface';
import {InvoicingPlanService} from '../../participation/service/invoicing-plan.service';
import {State} from '../../enumerations/state.model';
import {finalize} from 'rxjs/operators';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {ConfirmPopup} from 'primeng/confirmpopup';
import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';
import {TableModule} from 'primeng/table';
import {NavigationStateService} from '../../../layouts/navbar/navigation-state.service';
import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {CardComponent} from '../../../shared/components/card/card.component';
import {IconField} from 'primeng/iconfield';
import {InputIcon} from 'primeng/inputicon';
import {InputText} from 'primeng/inputtext';
import {MultiSelect} from 'primeng/multiselect';
import {SplitMenuBoxComponent} from '../../../shared/components/split-menu-box/split-menu-box.component';
import {TranslateService} from '@ngx-translate/core';
import {MenuItem} from 'primeng/api';
import {InvoicingPlanHelperService} from '../../participation/service/invoicing-plan-helper.service';
import {getExhibitorFullName, IExhibitor} from '../../exhibitor/model/exhibitor.interface';
import {Badge} from 'primeng/badge';
import dayjs from 'dayjs/esm';
import FormatMediumDatePipe from '../../../shared/date/format-medium-date.pipe';

@Component({
    selector: 'app-invoicing-plan-list',
    templateUrl: './invoicing-plan-list.component.html',
               imports: [
                   RouterModule,
                   FormsModule,
                   SharedModule,
                   ReactiveFormsModule,
                   ButtonBoxComponent,
                   ConfirmPopup,
                   AlertErrorComponent,
                   TableModule,
                   ContentPageComponent,
                   CardComponent,
                   IconField,
                   InputIcon,
                   InputText,
                   MultiSelect,
                   SplitMenuBoxComponent,
                   Badge,
                   FormatMediumDatePipe
               ]
           })
export class InvoicingPlanListComponent implements OnInit {
    invoicingPlans: IInvoicingPlanList[] = [];
    isLoading = false;
    stateValues = Object.keys(State);
    params!: ParamMap;
    protected readonly navigationStateService = inject(NavigationStateService);
    protected readonly invoicingPlanHelperService = inject(InvoicingPlanHelperService);
    private readonly invoicingPlanService = inject(InvoicingPlanService);
    private readonly translateService = inject(TranslateService);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly router = inject(Router);

    ngOnInit(): void {
        combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(
            ([params]) => {
                this.params = params;

                if (!this.invoicingPlans || this.invoicingPlans.length === 0) {
                    this.load();
                }
            });
    }

    readonly actionMenuItems: MenuItem[] = [
        {
            label: this.translateService.instant('common.refresh') as string,
            icon: 'pi pi-sync',
            command: () => this.refresh()
        }
    ];

    load(): void {
        this.isLoading = true;
        const idSalon = this.params.get('idSalon')!;

        this.invoicingPlanService
            .queryBySalon(idSalon)
            .pipe(finalize(() => (this.isLoading = false)))
            .subscribe(result => {
                this.invoicingPlans = result.body ?? [];
            });
    }

    getExhibitorFullName(exhibitor: IExhibitor | null | undefined): string {
        return getExhibitorFullName(exhibitor);
    }

    getStateBadgeClass(state: State | null | undefined): string {
        return this.invoicingPlanHelperService.getStateBadgeClass(state);
    }

    isExpired(expirationDate: dayjs.Dayjs | null | undefined, state: State | null | undefined): boolean {
        return this.invoicingPlanHelperService.isExpired(expirationDate, state);
    }

    refresh(): void {
        this.load();
    }

    previousState(): void {
        window.history.back();
    }
}
