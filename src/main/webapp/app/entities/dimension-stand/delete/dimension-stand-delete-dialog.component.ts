import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IDimensionStand } from '../dimension-stand.model';
import { DimensionStandService } from '../service/dimension-stand.service';

@Component({
  standalone: true,
  templateUrl: './dimension-stand-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class DimensionStandDeleteDialogComponent {
  dimensionStand?: IDimensionStand;

  protected dimensionStandService = inject(DimensionStandService);
  protected activeModal = inject(NgbActiveModal);

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: string): void {
    this.dimensionStandService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
