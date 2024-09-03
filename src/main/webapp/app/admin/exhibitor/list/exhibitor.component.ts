import { Component, inject, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Data, ParamMap, Router, RouterModule } from '@angular/router';
import { combineLatest, filter, Observable, tap } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { SortByDirective, SortDirective, SortService, type SortState, sortStateSignal } from 'app/shared/sort';
import { DurationPipe, FormatMediumDatePipe, FormatMediumDatetimePipe } from 'app/shared/date';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DEFAULT_SORT_DATA, ITEM_DELETED_EVENT, SORT } from 'app/config/navigation.constants';
import { IExhibitor } from '../exhibitor.model';
import { EntityArrayResponseType, ExhibitorService } from '../service/exhibitor.service';
import { ExhibitorDeleteDialogComponent } from '../delete/exhibitor-delete-dialog.component';
import { ExhibitorFilterFormGroup, ExhibitorFormService } from '../update/exhibitor-form.service';

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
  filters: ExhibitorFilterFormGroup = this.exhibitorFormService.createFilterFormGroup();
  protected activatedRoute = inject(ActivatedRoute);
  protected sortService = inject(SortService);
  protected modalService = inject(NgbModal);
  protected ngZone = inject(NgZone);

  trackId = (_index: number, item: IExhibitor): string => this.exhibitorService.getExhibitorIdentifier(item);

  ngOnInit(): void {
    combineLatest([this.activatedRoute.queryParamMap, this.activatedRoute.data])
      .pipe(
        tap(([params, data]) => this.fillComponentAttributeFromRoute(params, data)),
        tap(() => {
          if (!this.exhibitors || this.exhibitors.length === 0) {
            this.load();
          }
        }),
      )
      .subscribe();
  }

  delete(exhibitor: IExhibitor): void {
    const modalRef = this.modalService.open(ExhibitorDeleteDialogComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.exhibitor = exhibitor;
    // unsubscribe not needed because closed completes on modal close
    modalRef.closed
      .pipe(
        filter(reason => reason === ITEM_DELETED_EVENT),
        tap(() => this.load()),
      )
      .subscribe();
  }

  actionFilter(): void {
    this.load();
  }

  load(): void {
    this.queryBackend().subscribe({
      next: (res: EntityArrayResponseType) => {
        this.onResponseSuccess(res);
      },
    });
  }

  refresh(): void {
    this.filters.reset();
    this.load();
  }

  navigateToWithComponentValues(event: SortState): void {
    this.handleNavigation(event);
  }

  previousState(): void {
    window.history.back();
  }

  protected fillComponentAttributeFromRoute(params: ParamMap, data: Data): void {
    this.sortState.set(this.sortService.parseSortParam(params.get(SORT) ?? data[DEFAULT_SORT_DATA]));
  }

  protected onResponseSuccess(response: EntityArrayResponseType): void {
    const dataFromBody = this.fillComponentAttributesFromResponseBody(response.body);
    this.exhibitors = this.refineData(dataFromBody);

    const fullNameFilter = this.filters.get('fullName')?.value;
    if (fullNameFilter && fullNameFilter.length > 0) {
      this.exhibitors = this.exhibitors?.filter(exhibitor =>
        exhibitor.fullName?.toLocaleLowerCase().includes(fullNameFilter.toLocaleLowerCase()),
      );
    }
    const emailFilter = this.filters.get('email')?.value;
    if (emailFilter && emailFilter.length > 0) {
      this.exhibitors = this.exhibitors?.filter(exhibitor => exhibitor.email?.includes(emailFilter));
    }
  }

  protected refineData(data: IExhibitor[]): IExhibitor[] {
    const { predicate, order } = this.sortState();
    return predicate && order ? data.sort(this.sortService.startSort({ predicate, order })) : data;
  }

  protected fillComponentAttributesFromResponseBody(data: IExhibitor[] | null): IExhibitor[] {
    return data ?? [];
  }

  protected queryBackend(): Observable<EntityArrayResponseType> {
    this.isLoading = true;
    const queryObject: any = {
      sort: this.sortService.buildSortParam(this.sortState()),
    };
    return this.exhibitorService.query(queryObject).pipe(tap(() => (this.isLoading = false)));
  }

  protected handleNavigation(sortState: SortState): void {
    const queryParamsObj = {
      sort: this.sortService.buildSortParam(sortState),
    };

    this.ngZone.run(() => {
      this.router.navigate(['./'], {
        relativeTo: this.activatedRoute,
        queryParams: queryParamsObj,
      });
    });
  }
}
