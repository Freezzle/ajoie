import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IConfigurationSalon } from '../configuration-salon.model';
import { ConfigurationSalonService } from '../service/configuration-salon.service';

@Component({
  standalone: true,
  templateUrl: './configuration-salon-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class ConfigurationSalonDeleteDialogComponent {
  configurationSalon?: IConfigurationSalon;

  protected configurationSalonService = inject(ConfigurationSalonService);
  protected activeModal = inject(NgbActiveModal);

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: string): void {
    this.configurationSalonService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
