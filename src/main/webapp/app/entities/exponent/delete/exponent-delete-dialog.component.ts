import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IExponent } from '../exponent.model';
import { ExponentService } from '../service/exponent.service';

@Component({
  standalone: true,
  templateUrl: './exponent-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class ExponentDeleteDialogComponent {
  exponent?: IExponent;

  protected exponentService = inject(ExponentService);
  protected activeModal = inject(NgbActiveModal);

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: string): void {
    this.exponentService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
