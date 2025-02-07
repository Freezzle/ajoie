import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_UPDATED_EVENT } from 'app/config/navigation.constants';
import { ErrorModel } from '../../../shared/field-error/error.model';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';

@Component({
  standalone: true,
  templateUrl: './rename-plan-dialog.component.html',
  imports: [SharedModule, FormsModule, FieldErrorComponent, ReactiveFormsModule],
})
export class RenamePlanDialogComponent {

  floorName: string = '';

  protected activeModal = inject(NgbActiveModal);

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmAdd(): void {
    this.activeModal.close({ event: ITEM_UPDATED_EVENT, data: this.floorName });
  }

  protected readonly ErrorModel = ErrorModel;
}
