import { Component, inject, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EMPTY, filter, Observable, of, tap } from 'rxjs';
import { finalize, map, mergeMap } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IExponent } from 'app/entities/exponent/exponent.model';
import { ExponentService } from 'app/entities/exponent/service/exponent.service';
import { ISalon } from 'app/entities/salon/salon.model';
import { SalonService } from 'app/entities/salon/service/salon.service';
import { Status } from 'app/entities/enumerations/status.model';
import { ParticipationService } from '../service/participation.service';
import { IInvoicingPlan, IParticipation } from '../participation.model';
import { ParticipationFormService, ParticipationFormGroup } from './participation-form.service';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import StatusPipe from '../../../shared/pipe/status.pipe';
import { IConference } from '../../conference/conference.model';
import { ConferenceDeleteDialogComponent } from '../../conference/delete/conference-delete-dialog.component';
import { ITEM_DELETED_EVENT } from '../../../config/navigation.constants';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConferenceService } from '../../conference/service/conference.service';
import { StandDeleteDialogComponent } from '../../stand/delete/stand-delete-dialog.component';
import { IStand } from '../../stand/stand.model';
import { StandService } from '../../stand/service/stand.service';

@Component({
  standalone: true,
  selector: 'jhi-participation-update',
  templateUrl: './participation-update.component.html',
  imports: [SharedModule, RouterModule, FormsModule, ReactiveFormsModule, ColorStatusPipe, StatusPipe],
})
export class ParticipationUpdateComponent implements OnInit {
  isSaving = false;
  participation: IParticipation | null = null;
  statusValues = Object.keys(Status);
  readonlyForm = false;
  conferences$: Observable<IConference[]> | undefined;
  stands$: Observable<IStand[]> | undefined;

  exponentsSharedCollection: IExponent[] = [];
  salonsSharedCollection: ISalon[] = [];

  protected participationService = inject(ParticipationService);
  protected participationFormService = inject(ParticipationFormService);
  protected conferenceService = inject(ConferenceService);
  protected standService = inject(StandService);
  protected exponentService = inject(ExponentService);
  protected salonService = inject(SalonService);
  protected activatedRoute = inject(ActivatedRoute);
  protected modalService = inject(NgbModal);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: ParticipationFormGroup = this.participationFormService.createParticipationFormGroup();

  compareExponent = (o1: IExponent | null, o2: IExponent | null): boolean => this.exponentService.compareExponent(o1, o2);

  compareSalon = (o1: ISalon | null, o2: ISalon | null): boolean => this.salonService.compareSalon(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ participation, readonly }) => {
      this.readonlyForm = readonly;
      this.participation = participation;
      if (participation) {
        this.updateForm(participation);
        if (this.readonlyForm) {
          this.readOnlyBack();
          this.loadConferences();
          this.loadStands();
        } else {
          this.writeBack();
        }
      }

      this.loadRelationshipsOptions();
    });
  }

  readOnlyBack(): void {
    this.readonlyForm = true;
    this.editForm.disable();
  }

  writeBack(): void {
    this.readonlyForm = false;
    this.editForm.enable();
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const participation = this.participationFormService.getParticipation(this.editForm);
    if (participation.id !== null) {
      this.subscribeToSaveResponse(this.participationService.update(participation));
    } else {
      this.subscribeToSaveResponse(this.participationService.create(participation));
    }
  }

  deleteConference(conference: IConference): void {
    const modalRef = this.modalService.open(ConferenceDeleteDialogComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.conference = conference;
    // unsubscribe not needed because closed completes on modal close
    modalRef.closed
      .pipe(
        filter(reason => reason === ITEM_DELETED_EVENT),
        tap(() => this.loadConferences()),
      )
      .subscribe();
  }

  deleteStand(stand: IStand): void {
    const modalRef = this.modalService.open(StandDeleteDialogComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.stand = stand;
    // unsubscribe not needed because closed completes on modal close
    modalRef.closed
      .pipe(
        filter(reason => reason === ITEM_DELETED_EVENT),
        tap(() => this.loadStands()),
      )
      .subscribe();
  }

  protected loadConferences(): void {
    const queryObject: any = {
      idParticipation: this.participation?.id,
    };
    this.conferences$ = this.conferenceService.query(queryObject).pipe(
      mergeMap((conferences: HttpResponse<IConference[]>) => {
        if (conferences.body) {
          return of(conferences.body);
        } else {
          return EMPTY;
        }
      }),
    );
  }

  protected loadStands(): void {
    const queryObject: any = {
      idParticipation: this.participation?.id,
    };
    this.stands$ = this.standService.query(queryObject).pipe(
      mergeMap((stands: HttpResponse<IStand[]>) => {
        if (stands.body) {
          return of(stands.body);
        } else {
          return EMPTY;
        }
      }),
    );
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IParticipation>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
      next: () => this.onSaveSuccess(),
      error: () => this.onSaveError(),
    });
  }

  protected onSaveSuccess(): void {
    this.previousState();
  }

  protected onSaveError(): void {
    // Api for inheritance.
  }

  protected onSaveFinalize(): void {
    this.isSaving = false;
  }

  protected updateForm(participation: IParticipation): void {
    this.participation = participation;
    this.participationFormService.resetForm(this.editForm, participation);

    this.exponentsSharedCollection = this.exponentService.addExponentToCollectionIfMissing<IExponent>(
      this.exponentsSharedCollection,
      participation.exponent,
    );
    this.salonsSharedCollection = this.salonService.addSalonToCollectionIfMissing<ISalon>(this.salonsSharedCollection, participation.salon);
  }

  protected loadRelationshipsOptions(): void {
    this.exponentService
      .query()
      .pipe(map((res: HttpResponse<IExponent[]>) => res.body ?? []))
      .pipe(
        map((exponents: IExponent[]) =>
          this.exponentService.addExponentToCollectionIfMissing<IExponent>(exponents, this.participation?.exponent),
        ),
      )
      .subscribe((exponents: IExponent[]) => (this.exponentsSharedCollection = exponents));

    this.salonService
      .query()
      .pipe(map((res: HttpResponse<ISalon[]>) => res.body ?? []))
      .pipe(map((salons: ISalon[]) => this.salonService.addSalonToCollectionIfMissing<ISalon>(salons, this.participation?.salon)))
      .subscribe((salons: ISalon[]) => (this.salonsSharedCollection = salons));
  }
}
