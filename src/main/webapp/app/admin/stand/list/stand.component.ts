import { Component, NgZone, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Data, ParamMap, Router, RouterModule } from '@angular/router';
import { combineLatest, filter, Observable, Subscription, tap } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { sortStateSignal, SortDirective, SortByDirective, type SortState, SortService } from 'app/shared/sort';
import { DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe } from 'app/shared/date';
import { FormsModule } from '@angular/forms';
import { SORT, ITEM_DELETED_EVENT, DEFAULT_SORT_DATA } from 'app/config/navigation.constants';
import { IStand } from '../stand.model';
import { EntityArrayResponseType, StandService } from '../service/stand.service';
import { StandDeleteDialogComponent } from '../delete/stand-delete-dialog.component';
import { Location } from '@angular/common';
import FaIconBooleanPipe from '../../../shared/pipe/fa-icon-boolean.pipe';
import FaIconColorBooleanPipe from '../../../shared/pipe/fa-icon-color-boolean.pipe';

@Component({
  standalone: true,
  selector: 'jhi-stand',
  templateUrl: './stand.component.html',
  imports: [
    RouterModule,
    FormsModule,
    SharedModule,
    SortDirective,
    SortByDirective,
    DurationPipe,
    FormatMediumDatetimePipe,
    FormatMediumDatePipe,
    FaIconBooleanPipe,
    FaIconColorBooleanPipe,
  ],
})
export class StandComponent implements OnInit {
  subscription: Subscription | null = null;
  stands?: IStand[];
  isLoading = false;

  sortState = sortStateSignal({});

  public router = inject(Router);
  protected location = inject(Location);
  protected standService = inject(StandService);
  protected activatedRoute = inject(ActivatedRoute);
  protected sortService = inject(SortService);
  protected modalService = inject(NgbModal);
  protected ngZone = inject(NgZone);

  protected state: any;

  trackId = (_index: number, item: IStand): string => this.standService.getStandIdentifier(item);

  ngOnInit(): void {
    this.state = history.state;

    if (!this.stands || this.stands.length === 0) {
      this.load();
    }
  }

  delete(stand: IStand): void {
    const modalRef = this.modalService.open(StandDeleteDialogComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.stand = stand;
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
    this.stands = this.fillComponentAttributesFromResponseBody(response.body);
  }

  protected fillComponentAttributesFromResponseBody(data: IStand[] | null): IStand[] {
    return data ?? [];
  }

  protected queryBackend(): Observable<EntityArrayResponseType> {
    this.isLoading = true;
    const queryObject: any = {
      idSalon: this.state.idSalon,
    };
    return this.standService.query(queryObject).pipe(tap(() => (this.isLoading = false)));
  }
}
