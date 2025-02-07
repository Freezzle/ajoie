import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { combineLatest, Observable, of } from 'rxjs';
import { finalize } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IExhibitor } from '../exhibitor.model';
import { ExhibitorService } from '../service/exhibitor.service';
import { ExhibitorFormGroup, ExhibitorFormService } from './exhibitor-form.service';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';
import { ErrorModel } from '../../../shared/field-error/error.model';
import { LANGUAGES } from '../../../config/language.constants';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import StatusPipe from '../../../shared/pipe/status.pipe';
import { IParticipation } from '../../participation/participation.model';

@Component({
  standalone: true,
  selector: 'jhi-exhibitor-update',
  templateUrl: './exhibitor-update.component.html',
  imports: [
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    FieldErrorComponent,
    ColorStatusPipe,
    StatusPipe,
    RouterLink,
  ],
})
export class ExhibitorUpdateComponent implements OnInit {
  protected exhibitorService = inject(ExhibitorService);
  protected exhibitorFormService = inject(ExhibitorFormService);
  protected activatedRoute = inject(ActivatedRoute);

  isSaving = false;
  exhibitor: IExhibitor | null = null;
  readonlyForm = false;
  editForm: FormGroup<ExhibitorFormGroup> = this.exhibitorFormService.createExhibitorFormGroup({
    id: null,
    language: 'fr',
  });
  languageValues = LANGUAGES;

  participations$: Observable<IParticipation[]> = of([]);

  ngOnInit(): void {
    combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(
      ([params, data]) => {
        this.exhibitor = data['exhibitor'];
        this.readonlyForm = data['readonly'];

        if (this.exhibitor) {
          this.editForm = this.exhibitorFormService.createExhibitorFormGroup(this.exhibitor);

          if (this.readonlyForm) {
            this.readOnlyBack();
          } else {
            this.writeBack();
          }

          this.loadRelationships(this.exhibitor.id);
        }
      },
    );
  }

  loadRelationships(idExhibitor: string): void {
    this.participations$ = this.exhibitorService.findParticipations(idExhibitor);
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

    const exhibitor = this.exhibitorFormService.getExhibitor(this.editForm);
    if (exhibitor.id !== null) {
      this.exhibitorService
        .update(exhibitor)
        .pipe(finalize(() => (this.isSaving = false)))
        .subscribe(() => {
          this.previousState();
        });
    } else {
      this.exhibitorService
        .create(exhibitor)
        .pipe(finalize(() => (this.isSaving = false)))
        .subscribe(() => {
          this.previousState();
        });
    }
  }

  get getFullName(): FormControl {
    return this.editForm.get('fullName') as FormControl;
  }

  get getEmail(): FormControl {
    return this.editForm.get('email') as FormControl;
  }

  get getLanguage(): FormControl {
    return this.editForm.get('language') as FormControl;
  }

  get getPhoneNumber(): FormControl {
    return this.editForm.get('phoneNumber') as FormControl;
  }

  protected readonly ErrorModel = ErrorModel;
}
