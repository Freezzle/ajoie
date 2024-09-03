import {Component, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import {ITEM_DELETED_EVENT} from 'app/config/navigation.constants';
import {IParticipation} from '../participation.model';
import {ParticipationService} from '../service/participation.service';

@Component({
    standalone: true,
    templateUrl: './participation-delete-dialog.component.html',
    imports: [SharedModule, FormsModule],
})
export class ParticipationDeleteDialogComponent {
    participation?: IParticipation;

    protected participationService = inject(ParticipationService);
    protected activeModal = inject(NgbActiveModal);

    cancel(): void {
        this.activeModal.dismiss();
    }

    confirmDelete(id: string): void {
        this.participationService.delete(id).subscribe(() => {
            this.activeModal.close(ITEM_DELETED_EVENT);
        });
    }
}
