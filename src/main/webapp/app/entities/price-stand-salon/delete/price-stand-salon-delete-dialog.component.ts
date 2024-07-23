import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IPriceStandSalon } from '../price-stand-salon.model';
import { PriceStandSalonService } from '../service/price-stand-salon.service';

@Component({
  standalone: true,
  templateUrl: './price-stand-salon-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class PriceStandSalonDeleteDialogComponent {
  priceStandSalon?: IPriceStandSalon;

  protected priceStandSalonService = inject(PriceStandSalonService);
  protected activeModal = inject(NgbActiveModal);

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: string): void {
    this.priceStandSalonService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
