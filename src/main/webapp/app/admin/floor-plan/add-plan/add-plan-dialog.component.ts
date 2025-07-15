import {Component, inject} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import {ITEM_ADDED_EVENT} from 'app/config/navigation.constants';
import {AddPlanInfo} from '../floor-plan.model';
import {ErrorModel} from '../../../shared/field-error/error.model';
import {AlertErrorComponent} from "../../../shared/alert/alert-error.component";

@Component({
    templateUrl: './add-plan-dialog.component.html',
    imports: [SharedModule, FormsModule, ReactiveFormsModule, AlertErrorComponent]
})
export class AddPlanDialogComponent {

    info: AddPlanInfo = {
        name: '',
        heightMeter: 15,
        widthMeter: 30,
        spacingMeter: 0.5,
    };

    protected activeModal = inject(NgbActiveModal);

    cancel(): void {
        this.activeModal.dismiss();
    }

    confirmAdd(): void {
        this.activeModal.close({event: ITEM_ADDED_EVENT, data: this.info});
    }

    protected readonly ErrorModel = ErrorModel;
}
