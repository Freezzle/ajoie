import { Component, inject, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IExhibitor } from '../exhibitor.model';
import { ExhibitorService } from '../service/exhibitor.service';
import { ExhibitorFormGroup, ExhibitorFormService } from './exhibitor-form.service';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';
import { ErrorModel } from '../../../shared/field-error/error.model';

@Component({
  standalone: true,
  selector: 'jhi-exhibitor-update',
  templateUrl: './exhibitor-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule, FieldErrorComponent],
})
export class ExhibitorUpdateComponent implements OnInit {
  isSaving = false;
  exhibitor: IExhibitor | null = null;
  readonlyForm = false;

  protected exhibitorService = inject(ExhibitorService);
  protected exhibitorFormService = inject(ExhibitorFormService);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: ExhibitorFormGroup = this.exhibitorFormService.createExhibitorFormGroup();
  protected activatedRoute = inject(ActivatedRoute);

  ngOnInit(): void {
    combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(([params, data]) => {
      this.readonlyForm = data['readonly'];
      this.exhibitor = data['exhibitor'];

      if (this.exhibitor) {
        this.updateForm(this.exhibitor);

        if (this.readonlyForm) {
          this.readOnlyBack();
        } else {
          this.writeBack();
        }
      }
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
    const exhibitor = this.exhibitorFormService.getExhibitor(this.editForm);
    if (exhibitor.id !== null) {
      this.subscribeToSaveResponse(this.exhibitorService.update(exhibitor));
    } else {
      this.subscribeToSaveResponse(this.exhibitorService.create(exhibitor));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IExhibitor>>): void {
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

  protected updateForm(exhibitor: IExhibitor): void {
    this.exhibitor = exhibitor;
    this.exhibitorFormService.resetForm(this.editForm, exhibitor);
  }

  get getFullName(): FormControl {
    return this.editForm.get('fullName') as FormControl;
  }

  get getEmail(): FormControl {
    return this.editForm.get('email') as FormControl;
  }

  get getPhoneNumber(): FormControl {
    return this.editForm.get('phoneNumber') as FormControl;
  }

  protected readonly ErrorModel = ErrorModel;
}
