import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IExhibitor } from '../exhibitor.model';
import { ExhibitorService } from '../service/exhibitor.service';

@Component({
  standalone: true,
  templateUrl: './exhibitor-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class ExhibitorDeleteDialogComponent {
  exhibitor?: IExhibitor;

  protected exhibitorService = inject(ExhibitorService);
  protected activeModal = inject(NgbActiveModal);

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: string): void {
    this.exhibitorService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
