import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';

@Component({
  standalone: true,
  templateUrl: './delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class DeleteDialogComponent {
  translateKey: string = '';
  translateValues: { [key: string]: unknown } = {};

  protected activeModal = inject(NgbActiveModal);

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(): void {
    this.activeModal.close(ITEM_DELETED_EVENT);
  }
}
