import {Component, inject, input, model, OnDestroy, output} from '@angular/core';
import {Dialog} from 'primeng/dialog';
import {ButtonDirective} from 'primeng/button';
import {PrimeTemplate} from 'primeng/api';
import {DialogDraftService} from '../../services/dialog-draft.service';

export type AppDialogMode = 'view' | 'edit';

@Component({
               selector: 'dialog-box',
               imports: [
                   Dialog,
                   ButtonDirective,
                   PrimeTemplate
               ],
               templateUrl: './dialog-box.component.html',
               styleUrl: './dialog-box.component.scss'
           })
export class DialogBoxComponent implements OnDestroy {
    private readonly draftService = inject(DialogDraftService);

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

    cancel = output<void>();
    confirm = output<any>();
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
        this.requestClose(); // requestClose appelle déjà resetDraft()
    }

    onConfirmClick() {
        const draft = this.draftService.getDraft();
        this.confirm.emit(draft);

        if (!this.confirmLoading()) {
            this.requestClose();
        }
    }

    ngOnDestroy() {
        this.draftService.unregisterDraft();
    }
}