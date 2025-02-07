import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { combineLatest, filter, switchMap, tap } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { SortByDirective, SortDirective } from 'app/shared/sort';
import { DurationPipe, FormatMediumDatePipe, FormatMediumDatetimePipe } from 'app/shared/date';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IStand } from '../stand.model';
import { StandService } from '../service/stand.service';
import StatusPipe from '../../../shared/pipe/status.pipe';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import { StandFilterFormGroup, StandFormService } from '../update/stand-form.service';
import { Status } from '../../enumerations/status.model';
import { DeleteDialogComponent } from '../../../shared/delete-dialog/delete-dialog.component';
import { finalize } from 'rxjs/operators';
import { containExhibitorName, getExhibitorName } from '../../exhibitor/exhibitor.model';

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
    StatusPipe,
    ColorStatusPipe,
    ReactiveFormsModule,
  ],
})
export class StandComponent implements OnInit {
  protected standService = inject(StandService);
  protected activatedRoute = inject(ActivatedRoute);
  protected modalService = inject(NgbModal);
  protected standFormService = inject(StandFormService);

  statusValues = Object.keys(Status);
  stands: IStand[] = [];
  isLoading = false;
  params: any;
  filters: FormGroup<StandFilterFormGroup> = this.standFormService.createFilterFormGroup();

  ngOnInit(): void {
    combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(
      ([params, data]) => {
        this.params = params;

        if (!this.stands || this.stands.length === 0) {
          this.actionFilter();
        }
      },
    );
  }

  delete(stand: IStand): void {
    const modalRef = this.modalService.open(DeleteDialogComponent, {
      size: 'lg',
      backdrop: 'static',
    });
    modalRef.componentInstance.translateKey = 'stand.delete.question';
    modalRef.componentInstance.translateValues = {
      description: getExhibitorName(stand.participation?.exhibitor),
    };

    modalRef.closed
      .pipe(
        filter((reason) => reason === ITEM_DELETED_EVENT),
        switchMap(() => this.standService.delete(stand.id)),
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
      idSalon: this.params.get('idSalon'),
      idParticipation: this.params.get('idParticipation'),
    };
    this.standService
      .query(queryObject)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe((result) => {
        this.stands = result.body ?? [];

        const fullNameFilter = this.filters.get('fullName')?.value;
        if (fullNameFilter && fullNameFilter.length > 0) {
          this.stands = this.stands?.filter((stand) =>
            containExhibitorName(stand.participation?.exhibitor, fullNameFilter),
          );
        }

        const statusFilter = this.filters.get('status')?.value;
        if (statusFilter && statusFilter.length > 0) {
          this.stands = this.stands?.filter((stand) => stand.status?.includes(statusFilter));
        }
      });
  }

  refresh(): void {
    this.filters.reset();
    this.actionFilter();
  }

  previousState(): void {
    window.history.back();
  }

  protected readonly getExhibitorName = getExhibitorName;
}
