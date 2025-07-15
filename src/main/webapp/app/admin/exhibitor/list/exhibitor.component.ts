import {Component, inject, NgZone, OnInit} from '@angular/core';
import {ActivatedRoute, Data, ParamMap, Router, RouterModule} from '@angular/router';
import {combineLatest, filter, switchMap, tap} from 'rxjs';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import {SortByDirective, SortDirective, SortService, type SortState, sortStateSignal} from 'app/shared/sort';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DEFAULT_SORT_DATA, ITEM_DELETED_EVENT, SORT} from 'app/config/navigation.constants';
import {containsExhibitorName, getFirstExhibitorName, IExhibitor} from '../model/exhibitor.interface';
import {ExhibitorService} from '../service/exhibitor.service';
import {ExhibitorFilterFormGroup, ExhibitorFormService} from '../service/exhibitor-form.service';
import {DeleteDialogComponent} from '../../../shared/delete-dialog/delete-dialog.component';
import {finalize} from 'rxjs/operators';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {LinkBoxComponent} from '../../../shared/components/link-box/link-box.component';
import {PaginationComponent} from '../../../shared/pagination/pagination.component';
import {PaginationEvent} from '../../../shared/pagination/pagination-event.interface';
import {AlertErrorComponent} from "../../../shared/alert/alert-error.component";

@Component({
    selector: 'jhi-exhibitor',
    templateUrl: './exhibitor.component.html',
    imports: [
        RouterModule,
        FormsModule,
        SharedModule,
        SortDirective,
        SortByDirective,
        ReactiveFormsModule,
        ButtonBoxComponent,
        LinkBoxComponent,
        PaginationComponent,
        AlertErrorComponent,
    ]
})
export class ExhibitorComponent implements OnInit {
    public router = inject(Router);
    protected activatedRoute = inject(ActivatedRoute);
    protected sortService = inject(SortService);
    protected modalService = inject(NgbModal);
    protected ngZone = inject(NgZone);
    protected exhibitorService = inject(ExhibitorService);
    protected exhibitorFormService = inject(ExhibitorFormService);

    sortState = sortStateSignal({});

    isLoading = false;
    exhibitors: IExhibitor[] = [];
    exhibitorsPaginated: IExhibitor[] = [];
    filters: FormGroup<ExhibitorFilterFormGroup> = this.exhibitorFormService.createFilterFormGroup();

    ngOnInit(): void {
        combineLatest([this.activatedRoute.queryParamMap, this.activatedRoute.data])
            .pipe(
                tap(([params, data]) => this.fillComponentAttributeFromRoute(params, data)),
                tap(() => {
                    if (!this.exhibitors || this.exhibitors.length === 0) {
                        this.actionFilter();
                    }
                }),
            )
            .subscribe();
    }

    delete(exhibitor: IExhibitor): void {
        const modalRef = this.modalService.open(DeleteDialogComponent, {
            size: 'lg',
            backdrop: 'static',
        });
        modalRef.componentInstance.translateKey = 'exhibitor.delete.question';
        modalRef.componentInstance.translateValues = {id: getFirstExhibitorName(exhibitor)};

        modalRef.closed
            .pipe(
                filter((reason) => reason === ITEM_DELETED_EVENT),
                switchMap(() => this.exhibitorService.delete(exhibitor.id)),
                tap(() => this.actionFilter()), // Recharge les données
            )
            .subscribe();
    }

    actionFilter(): void {
        this.load();
    }

    load(): void {
        this.isLoading = true;

        const queryObject: any = {
            sort: this.sortService.buildSortParam(this.sortState()),
        };

        this.exhibitorService
            .query(queryObject)
            .pipe(finalize(() => (this.isLoading = false)))
            .subscribe((result) => {
                this.exhibitors = result.body ?? [];
                this.exhibitors = this.sorting(this.exhibitors);

                const fullNameFilter = this.filters.get('fullName')?.value;
                if (fullNameFilter && fullNameFilter.length > 0) {
                    this.exhibitors = this.exhibitors?.filter((exhibitor) =>
                        containsExhibitorName(exhibitor, fullNameFilter),
                    );
                }

                const emailFilter = this.filters.get('email')?.value;
                if (emailFilter && emailFilter.length > 0) {
                    this.exhibitors = this.exhibitors?.filter((exhibitor) =>
                        exhibitor.email?.includes(emailFilter),
                    );
                }

                this.refreshExhibitors({page: 1, pageSize: 10});
            });
    }

    refresh(): void {
        this.filters.reset();
        this.actionFilter();
    }

    navigateToWithComponentValues(event: SortState): void {
        const queryParamsObj = {
            sort: this.sortService.buildSortParam(event),
        };

        this.ngZone.run(() => {
            this.router.navigate(['./'], {
                relativeTo: this.activatedRoute,
                queryParams: queryParamsObj,
            });
        });
    }

    previousState(): void {
        window.history.back();
    }

    protected fillComponentAttributeFromRoute(params: ParamMap, data: Data): void {
        this.sortState.set(
            this.sortService.parseSortParam(params.get(SORT) ?? data[DEFAULT_SORT_DATA]),
        );
    }

    protected sorting(data: IExhibitor[]): IExhibitor[] {
        const {predicate, order} = this.sortState();
        return predicate && order ? data.sort(this.sortService.startSort({predicate, order})) : data;
    }

    refreshExhibitors(event: PaginationEvent): void {
        this.exhibitorsPaginated = this.exhibitors.slice((event.page - 1) * event.pageSize,
            (event.page - 1) * event.pageSize + event.pageSize);
    }
}
