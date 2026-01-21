import {Component, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import {ITEM_DELETED_EVENT} from 'app/config/navigation.constants';
import {AlertErrorComponent} from '../alert/alert-error.component';
import {ButtonBoxComponent} from '../components/button-box/button-box.component';

@Component({
               templateUrl: './delete-dialog.component.html',
               imports: [SharedModule, FormsModule, AlertErrorComponent, ButtonBoxComponent]
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
