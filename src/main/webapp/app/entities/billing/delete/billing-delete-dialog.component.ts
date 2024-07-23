import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IBilling } from '../billing.model';
import { BillingService } from '../service/billing.service';

@Component({
  standalone: true,
  templateUrl: './billing-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class BillingDeleteDialogComponent {
  billing?: IBilling;

  protected billingService = inject(BillingService);
  protected activeModal = inject(NgbActiveModal);

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: string): void {
    this.billingService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
