import {Component, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import {ITEM_DELETED_EVENT} from 'app/config/navigation.constants';
import {IStand} from '../stand.model';
import {StandService} from '../service/stand.service';

@Component({
    standalone: true,
    templateUrl: './stand-delete-dialog.component.html',
    imports: [SharedModule, FormsModule],
})
export class StandDeleteDialogComponent {
    stand?: IStand;

    protected standService = inject(StandService);
    protected activeModal = inject(NgbActiveModal);

    cancel(): void {
        this.activeModal.dismiss();
    }

    confirmDelete(id: string): void {
        this.standService.delete(id).subscribe(() => {
            this.activeModal.close(ITEM_DELETED_EVENT);
        });
    }
}
