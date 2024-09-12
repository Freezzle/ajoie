import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest } from 'rxjs';
import { finalize } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

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
  protected exhibitorService = inject(ExhibitorService);
  protected exhibitorFormService = inject(ExhibitorFormService);
  protected activatedRoute = inject(ActivatedRoute);

  isSaving = false;
  exhibitor: IExhibitor | null = null;
  readonlyForm = false;
  editForm: FormGroup<ExhibitorFormGroup> = this.exhibitorFormService.createExhibitorFormGroup({ id: null });

  ngOnInit(): void {
    combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(([params, data]) => {
      this.readonlyForm = data['readonly'];
      this.exhibitor = data['exhibitor'];

      if (this.exhibitor) {
        this.editForm = this.exhibitorFormService.createExhibitorFormGroup(this.exhibitor);

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
        .subscribe();
    }
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
