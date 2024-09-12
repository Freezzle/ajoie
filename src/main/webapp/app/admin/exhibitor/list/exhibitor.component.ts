import { Component, inject, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Data, ParamMap, Router, RouterModule } from '@angular/router';
import { combineLatest, filter, switchMap, tap } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { SortByDirective, SortDirective, SortService, type SortState, sortStateSignal } from 'app/shared/sort';
import { DurationPipe, FormatMediumDatePipe, FormatMediumDatetimePipe } from 'app/shared/date';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DEFAULT_SORT_DATA, ITEM_DELETED_EVENT, SORT } from 'app/config/navigation.constants';
import { IExhibitor } from '../exhibitor.model';
import { ExhibitorService } from '../service/exhibitor.service';
import { ExhibitorFilterFormGroup, ExhibitorFormService } from '../update/exhibitor-form.service';
import { DeleteDialogComponent } from '../../../shared/delete-dialog/delete-dialog.component';
import { finalize } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'jhi-exhibitor',
  templateUrl: './exhibitor.component.html',
  imports: [
    RouterModule,
    FormsModule,
    SharedModule,
    SortDirective,
    SortByDirective,
    DurationPipe,
    FormatMediumDatetimePipe,
    FormatMediumDatePipe,
    ReactiveFormsModule,
  ],
})
export class ExhibitorComponent implements OnInit {
  sortState = sortStateSignal({});

  public router = inject(Router);
  exhibitors?: IExhibitor[];
  isLoading = false;
  protected exhibitorService = inject(ExhibitorService);
  protected exhibitorFormService = inject(ExhibitorFormService);
  filters: FormGroup<ExhibitorFilterFormGroup> = this.exhibitorFormService.createFilterFormGroup();
  protected activatedRoute = inject(ActivatedRoute);
  protected sortService = inject(SortService);
  protected modalService = inject(NgbModal);
  protected ngZone = inject(NgZone);

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
    const modalRef = this.modalService.open(DeleteDialogComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.translateKey = 'exhibitor.delete.question';
    modalRef.componentInstance.translateValues = { id: exhibitor.fullName };

    modalRef.closed
      .pipe(
        filter(reason => reason === ITEM_DELETED_EVENT),
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
      .subscribe(result => {
        this.exhibitors = result.body ?? [];
        this.exhibitors = this.sorting(this.exhibitors);

        const fullNameFilter = this.filters.get('fullName')?.value;
        if (fullNameFilter && fullNameFilter.length > 0) {
          this.exhibitors = this.exhibitors?.filter(exhibitor =>
            exhibitor.fullName?.toLocaleLowerCase().includes(fullNameFilter.toLocaleLowerCase()),
          );
        }
        const therapistNameFilter = this.filters.get('therapistName')?.value;
        if (therapistNameFilter && therapistNameFilter.length > 0) {
          this.exhibitors = this.exhibitors?.filter(exhibitor =>
            exhibitor.therapistName?.toLocaleLowerCase().includes(therapistNameFilter.toLocaleLowerCase()),
          );
        }
        const emailFilter = this.filters.get('email')?.value;
        if (emailFilter && emailFilter.length > 0) {
          this.exhibitors = this.exhibitors?.filter(exhibitor => exhibitor.email?.includes(emailFilter));
        }
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
    this.sortState.set(this.sortService.parseSortParam(params.get(SORT) ?? data[DEFAULT_SORT_DATA]));
  }

  protected sorting(data: IExhibitor[]): IExhibitor[] {
    const { predicate, order } = this.sortState();
    return predicate && order ? data.sort(this.sortService.startSort({ predicate, order })) : data;
  }
}
