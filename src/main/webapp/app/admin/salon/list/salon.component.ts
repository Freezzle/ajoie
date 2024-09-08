import { Component, inject, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { filter, Observable, switchMap, tap } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { SortByDirective, SortDirective, SortService } from 'app/shared/sort';
import { DurationPipe, FormatMediumDatePipe, FormatMediumDatetimePipe } from 'app/shared/date';
import { FormsModule } from '@angular/forms';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { ISalon } from '../salon.model';
import { EntityArrayResponseType, SalonService } from '../service/salon.service';
import { DeleteDialogComponent } from '../../../shared/deletion/delete-dialog.component';

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
    if (!this.salons || this.salons.length === 0) {
      this.load();
    }
  }

  delete(salon: ISalon): void {
    const modalRef = this.modalService.open(DeleteDialogComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.translateKey = 'salon.delete.question';
    modalRef.componentInstance.translateValues = { id: salon.place };

    modalRef.closed
      .pipe(
        filter(reason => reason === ITEM_DELETED_EVENT),
        switchMap(() => this.salonService.delete(salon.id)),
        tap(() => this.load()), // Recharge les données
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
    this.salons = this.fillComponentAttributesFromResponseBody(response.body);
  }

  protected fillComponentAttributesFromResponseBody(data: ISalon[] | null): ISalon[] {
    return data ?? [];
  }

  protected queryBackend(): Observable<EntityArrayResponseType> {
    this.isLoading = true;
    return this.salonService.query().pipe(tap(() => (this.isLoading = false)));
  }
}
