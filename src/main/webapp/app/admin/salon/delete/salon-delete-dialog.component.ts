import {Component, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import {ITEM_DELETED_EVENT} from 'app/config/navigation.constants';
import {ISalon} from '../salon.model';
import {SalonService} from '../service/salon.service';

@Component({
    standalone: true,
    templateUrl: './salon-delete-dialog.component.html',
    imports: [SharedModule, FormsModule],
})
export class SalonDeleteDialogComponent {
    salon?: ISalon;

    protected salonService = inject(SalonService);
    protected activeModal = inject(NgbActiveModal);

    cancel(): void {
        this.activeModal.dismiss();
    }

    confirmDelete(id: string): void {
        this.salonService.delete(id).subscribe(() => {
            this.activeModal.close(ITEM_DELETED_EVENT);
        });
    }
}
