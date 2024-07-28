import { Component, NgZone, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Data, ParamMap, Router, RouterModule } from '@angular/router';
import { combineLatest, filter, Observable, Subscription, tap } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { sortStateSignal, SortDirective, SortByDirective, type SortState, SortService } from 'app/shared/sort';
import { DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe } from 'app/shared/date';
import { FormsModule } from '@angular/forms';
import { SORT, ITEM_DELETED_EVENT, DEFAULT_SORT_DATA } from 'app/config/navigation.constants';
import { ISalon } from '../salon.model';
import { EntityArrayResponseType, SalonService } from '../service/salon.service';
import { SalonDeleteDialogComponent } from '../delete/salon-delete-dialog.component';

@Component({
  standalone: true,
  selector: 'jhi-salon',
  templateUrl: './salon.component.html',
  imports: [
    RouterModule,
    FormsModule,
    SharedModule,
    SortDirective,
    SortByDirective,
    DurationPipe,
    FormatMediumDatetimePipe,
    FormatMediumDatePipe,
  ],
})
export class SalonComponent implements OnInit {
  salons?: ISalon[];
  isLoading = false;

  public router = inject(Router);
  protected salonService = inject(SalonService);
  protected activatedRoute = inject(ActivatedRoute);
  protected sortService = inject(SortService);
  protected modalService = inject(NgbModal);
  protected ngZone = inject(NgZone);

  ngOnInit(): void {
    combineLatest([this.activatedRoute.queryParamMap, this.activatedRoute.paramMap])
      .pipe(
        tap(([queryparams, params]) => {
          if (!this.salons || this.salons.length === 0) {
            this.load();
          }
        }),
      )
      .subscribe();
  }

  delete(salon: ISalon): void {
    const modalRef = this.modalService.open(SalonDeleteDialogComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.salon = salon;
    // unsubscribe not needed because closed completes on modal close
    modalRef.closed
      .pipe(
        filter(reason => reason === ITEM_DELETED_EVENT),
        tap(() => this.load()),
      )
      .subscribe();
  }

  load(): void {
    this.queryBackend().subscribe({
      next: (res: EntityArrayResponseType) => {
        this.onResponseSuccess(res);
      },
    });
  }

  previousState(): void {
    window.history.back();
  }

  protected onResponseSuccess(response: EntityArrayResponseType): void {
    const dataFromBody = this.fillComponentAttributesFromResponseBody(response.body);
    this.salons = dataFromBody;
  }

  protected fillComponentAttributesFromResponseBody(data: ISalon[] | null): ISalon[] {
    return data ?? [];
  }

  protected queryBackend(): Observable<EntityArrayResponseType> {
    this.isLoading = true;
    return this.salonService.query().pipe(tap(() => (this.isLoading = false)));
  }
}
