import { Component, inject, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { combineLatest, filter, Observable, of, switchMap } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ParticipationService } from '../service/participation.service';
import { getFormattedParticipationName, IParticipation } from '../model/participation.interface';
import { ParticipationFormGroup, ParticipationFormService } from '../service/participation-form.service';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import StatusPipe from '../../../shared/pipe/status.pipe';
import { ITEM_DELETED_EVENT } from '../../../config/navigation.constants';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConferenceService } from '../../conference/service/conference.service';
import { IStand } from '../../stand/model/stand.interface';
import { StandService } from '../../stand/service/stand.service';
import { ISalon } from '../../salon/model/salon.interface';
import { SalonService } from '../../salon/service/salon.service';
import { IExhibitor } from '../../exhibitor/model/exhibitor.interface';
import { ExhibitorService, formatterExhibitor } from '../../exhibitor/service/exhibitor.service';
import { formatterStatus, Status } from '../../enumerations/status.model';
import { DeleteDialogComponent } from '../../../shared/delete-dialog/delete-dialog.component';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';
import { ErrorModel } from '../../../shared/field-error/error.model';
import { ButtonBoxComponent } from '../../../shared/components/button-box/button-box.component';
import { LinkBoxComponent } from '../../../shared/components/link-box/link-box.component';
import { SelectBoxComponent } from '../../../shared/components/select-box/select-box.component';
import { DateBoxComponent } from '../../../shared/components/date-box/date-box.component';
import { NumberBoxComponent } from '../../../shared/components/number-box/number-box.component';
import { TextBoxComponent } from '../../../shared/components/text-box/text-box.component';
import { TextareaBoxComponent } from '../../../shared/components/textarea-box/textarea-box.component';
import { CheckboxBoxComponent } from '../../../shared/components/checkbox-box/checkbox-box.component';
import { TypeaheadBoxComponent } from '../../../shared/components/typeahead-box/typeahead-box.component';
import { IConference } from '../../conference/model/conference.interface';

@Component({
  standalone: true,
  selector: 'jhi-participation-update',
  templateUrl: './participation-update.component.html',
  imports: [SharedModule, RouterModule, FormsModule, ReactiveFormsModule, ColorStatusPipe, StatusPipe,
            FieldErrorComponent, ButtonBoxComponent, LinkBoxComponent, SelectBoxComponent, DateBoxComponent,
            NumberBoxComponent, TextBoxComponent, TextareaBoxComponent, CheckboxBoxComponent, TypeaheadBoxComponent],
})
export class ParticipationUpdateComponent implements OnInit {
  protected participationService = inject(ParticipationService);
  protected participationFormService = inject(ParticipationFormService);
  protected conferenceService = inject(ConferenceService);
  protected standService = inject(StandService);
  protected exhibitorService = inject(ExhibitorService);
  protected salonService = inject(SalonService);
  protected activatedRoute = inject(ActivatedRoute);
  protected modalService = inject(NgbModal);

  isLoading = false;
  isReadOnly = false;

  initialParticipation: IParticipation | null = null;
  statusValues = Object.keys(Status);
  conferences$: Observable<IConference[]> | undefined;
  stands$: Observable<IStand[]> | undefined;
  params: any;
  exhibitorsOptions: IExhibitor[] = [];
  salonsSharedCollection: ISalon[] = [];
  editForm: FormGroup<ParticipationFormGroup> = this.participationFormService.createParticipationFormGroup(
    { id: null });

  ngOnInit(): void {
    this.activateReadOnlyMode();

    combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data])
      .pipe(
        map(([params, data]) => ({
          params,
          isReadOnly: data['readonly'],
          initialParticipation: data['participation'] as IParticipation,
        })),
      )
      .subscribe(({ params, isReadOnly, initialParticipation }) => {
        this.workReload(isReadOnly, params, initialParticipation);
      });
  }

  private workReload(isReadOnly: boolean, params: any, participation: IParticipation) {
    this.isReadOnly = isReadOnly;
    this.initialParticipation = { ...participation };
    this.params = params;

    this.editForm = this.participationFormService.createParticipationFormGroup(participation);
    this.loadRelationshipsOptions(participation);

    if (participation) {
      this.loadRelationships(participation!.id);
    }

    isReadOnly ? this.activateReadOnlyMode(false) : this.activateEditMode();
  }

  private reload(idParticipation: string): void {
    this.participationService.find(idParticipation).subscribe(participation => {
      this.workReload(this.isReadOnly, this.params, participation.body!);
    });
  }

  activateReadOnlyMode(reset: boolean = true): void {
    this.isReadOnly = true;
    if (reset) {
      this.editForm = this.participationFormService.createParticipationFormGroup(this.initialParticipation!);
    }
    this.editForm.disable();
  }

  activateEditMode(): void {
    this.isReadOnly = false;
    this.editForm.enable();
  }


  previousState(): void {
    window.history.back();
  }

  save(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;

    const participation = this.participationFormService.getParticipation(this.editForm);

    const saveOperation = participation.id != null
                          ? this.participationService.update(participation)
                          : this.participationService.create(participation);

    saveOperation.pipe(finalize(() => (this.isLoading = false)))
      .subscribe(() => {
        this.activateReadOnlyMode(false);
        this.reload(this.initialParticipation!.id!);
      });
  }

  deleteEntity(entity: IConference | IStand, type: 'conference' | 'stand'): void {
    const modalRef = this.modalService.open(DeleteDialogComponent, { size: 'lg', backdrop: 'static' });

    modalRef.componentInstance.translateKey = `${type}.delete.question`;

    modalRef.componentInstance.translateValues = type === 'conference' ? { title: (entity as IConference).title } :
      { description: getFormattedParticipationName((entity as IStand).participation) };

    modalRef.closed
      .pipe(
        filter(reason => reason === ITEM_DELETED_EVENT),
        switchMap(
          () => type === 'conference' ? this.conferenceService.delete(entity.id) : this.standService.delete(entity.id)),
      )
      .subscribe(() => this.reload(this.initialParticipation!.id!));
  }

  private loadRelationships(idParticipation: string): void {
    if (!idParticipation) {
      return;
    }

    const queryObject = { idParticipation: idParticipation };

    this.conferences$ = this.conferenceService.query(queryObject).pipe(
      map((result) => result ?? []),
      catchError(() => of([])),
    );

    this.stands$ = this.standService.query(queryObject).pipe(
      map((res) => res ?? []),
      catchError(() => of([])),
    );
  }

  protected loadRelationshipsOptions(participation: IParticipation): void {
    this.exhibitorService
      .query()
      .pipe(map((res: HttpResponse<IExhibitor[]>) => res.body ?? []))
      .pipe(
        map((exhibitors: IExhibitor[]) =>
          this.exhibitorService.addExhibitorOptionsIfMissing<IExhibitor>(exhibitors,
            participation?.exhibitor),
        ),
      )
      .subscribe((exhibitors: IExhibitor[]) => (this.exhibitorsOptions = exhibitors));

    this.salonService
      .query()
      .pipe(map((res: HttpResponse<ISalon[]>) => res.body ?? []))
      .pipe(
        map((salons: ISalon[]) => {
          if (this.params.get('idSalon')) {
            this.editForm.get('salon')
              ?.setValue(salons.find(salon => salon.id === this.params.get('idSalon')));
          }
          return this.salonService.addSalonOptionsIfMissing<ISalon>(salons, participation?.salon);
        }),
      )
      .subscribe((salons: ISalon[]) => (this.salonsSharedCollection = salons));
  }

  protected readonly ErrorModel = ErrorModel;
  protected readonly getFormattedParticipationName = getFormattedParticipationName;
  protected readonly formatterStatus = formatterStatus;
  protected readonly formatterExhibitor = formatterExhibitor;
}
