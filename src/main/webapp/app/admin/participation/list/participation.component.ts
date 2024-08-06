import { Component, NgZone, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Data, ParamMap, Router, RouterModule } from '@angular/router';
import { combineLatest, filter, Observable, Subscription, tap } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { sortStateSignal, SortDirective, SortByDirective, type SortState, SortService } from 'app/shared/sort';
import { DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe } from 'app/shared/date';
import { FormsModule } from '@angular/forms';
import { SORT, ITEM_DELETED_EVENT, DEFAULT_SORT_DATA } from 'app/config/navigation.constants';
import { IParticipation } from '../participation.model';
import { EntityArrayResponseType, ParticipationService } from '../service/participation.service';
import { ParticipationDeleteDialogComponent } from '../delete/participation-delete-dialog.component';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import StatusPipe from '../../../shared/pipe/status.pipe';
import CheckBoolPipe from '../../../shared/pipe/check-boolean.pipe';
import ColorBoolPipe from '../../../shared/pipe/color-boolean.pipe';

@Component({
  standalone: true,
  selector: 'jhi-participation',
  templateUrl: './participation.component.html',
  imports: [
    RouterModule,
    FormsModule,
    SharedModule,
    SortDirective,
    SortByDirective,
    DurationPipe,
    FormatMediumDatetimePipe,
    FormatMediumDatePipe,
    ColorStatusPipe,
    StatusPipe,
    CheckBoolPipe,
    ColorBoolPipe,
  ],
})
export class ParticipationComponent implements OnInit {
  subscription: Subscription | null = null;
  participations?: IParticipation[];
  isLoading = false;

  public router = inject(Router);
  protected participationService = inject(ParticipationService);
  protected activatedRoute = inject(ActivatedRoute);
  protected sortService = inject(SortService);
  protected modalService = inject(NgbModal);
  protected ngZone = inject(NgZone);
  protected state: any;

  ngOnInit(): void {
    this.state = history.state;

    if (!this.participations || this.participations.length === 0) {
      this.load();
    }
  }

  delete(participation: IParticipation): void {
    const modalRef = this.modalService.open(ParticipationDeleteDialogComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.participation = participation;
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
    this.participations = dataFromBody;
  }

  protected fillComponentAttributesFromResponseBody(data: IParticipation[] | null): IParticipation[] {
    return data ?? [];
  }

  protected queryBackend(): Observable<EntityArrayResponseType> {
    this.isLoading = true;
    const queryObject: any = {
      idSalon: this.state.idSalon,
    };
    return this.participationService.query(queryObject).pipe(tap(() => (this.isLoading = false)));
  }
}
