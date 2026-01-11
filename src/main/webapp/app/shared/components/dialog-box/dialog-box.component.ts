import {Component, input, model, output, TemplateRef} from '@angular/core';
import {Dialog} from "primeng/dialog";
import {ButtonDirective} from "primeng/button";
import {PrimeTemplate} from "primeng/api";

export type AppDialogMode = 'view' | 'edit';

@Component({
    selector: 'dialog-box',
    imports: [
        Dialog,
        ButtonDirective,
        PrimeTemplate
    ],
    templateUrl: './dialog-box.component.html',
    styleUrl: './dialog-box.component.scss',
})
export class DialogBoxComponent {
    // Dialog purpose
    visible = model<boolean>(false);
    closable = input(true);
    closeOnEscape = input(true);
    dismissableMask = input(true);
    blockScroll = input(true);

    // Header purpose
    header = input<string>('');

    // Footer purpose
    mode = input<AppDialogMode>('view');
    cancelLabel = input('Annuler');
    confirmLabel = input('Valider');
    closeLabel = input('Fermer');
    confirmDisabled = input(false);
    confirmLoading = input(false);


    // Outputs modernes
    cancel = output<void>();
    confirm = output<void>();
    closed = output<void>();

    onHide() {
        this.visible.set(false);
        this.closed.emit();
    }

    requestClose() {
        this.visible.set(false);
        this.closed.emit();
    }

    onCancelClick() {
        this.cancel.emit();
        this.requestClose();
    }

    onConfirmClick() {
        this.confirm.emit();

        if (!this.confirmLoading()) {
            this.requestClose();
        }
    }
}