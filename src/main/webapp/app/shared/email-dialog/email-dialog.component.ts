import {Component, inject, Input, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import {EmailMessage} from './email-message';
import {TextBoxComponent} from '../components/text-box/text-box.component';
import {Editor, EditorModule} from 'primeng/editor';
import {ActionsService} from '../../admin/common/actions.service';
import {EmailAttachment} from './email-attachment';
import {finalize} from 'rxjs/operators';
import Quill from 'quill';
import {ButtonBoxComponent} from '../components/button-box/button-box.component';
import {ChipsBoxComponent} from '../components/chips-box/chips-box.component';

@Component({
               templateUrl: './email-dialog.component.html',
               styleUrl: './email-dialog.component.scss',
               imports: [SharedModule, FormsModule, EditorModule, ReactiveFormsModule, TextBoxComponent, ChipsBoxComponent, Editor, ButtonBoxComponent]
           })
export class EmailDialogComponent implements OnInit {

    @Input() template!: EmailMessage;
    @Input() context!: string;
    @Input() entityId!: number;
    isLoading = false;
    form!: FormGroup;
    quill?: Quill;
    private readonly actionsService = inject(ActionsService);
    private pendingHtml?: string;

    /**
     * Les envois groupés n'ont pas de destinataire direct : les destinataires passent par la liste BCC.
     */
    get isBulkSending(): boolean {
        return this.template.recipientsCount != null;
    }

    constructor(private fb: FormBuilder, public activeModal: NgbActiveModal) {
    }

    ngOnInit() {
        this.form = this.fb.group({
                                      from: [{
                                          value: this.template.from,
                                          disabled: true
                                      }, [Validators.required, Validators.email]],
                                      to: [this.template.to,
                                           this.isBulkSending ? [] : [Validators.required, Validators.email]],
                                      bcc: [this.normalizeBcc(this.template.bcc), [this.bccListValidator]],
                                      subject: [this.template.subject, Validators.required],
                                      body: [this.template.body, Validators.required],
                                      attachments: [this.template.attachments]
                                  });
        this.pendingHtml = this.template.body ?? '';
    }

    onEditorInit(event: any) {
        this.quill = event.editor;

        if (this.quill && this.pendingHtml != null) {
            this.quill.clipboard.dangerouslyPasteHTML(this.pendingHtml, 'silent');
            // optionnel: sync le formControl avec l’HTML réellement accepté par Quill
            this.form.get('body')?.setValue(this.quill.root.innerHTML, {emitEvent: false});
            this.pendingHtml = undefined;
        }
    }

    submit() {
        if (this.form.valid) {
            const value = this.form.getRawValue();
            const bcc = this.normalizeBcc(value.bcc);
            const payload: EmailMessage = {
                from: value.from,
                to: value.to,
                subject: value.subject,
                body: value.body,
                attachments: value.attachments,
                recipientsCount: this.template.recipientsCount
            };

            if (this.isBulkSending || bcc.length > 0) {
                payload.bcc = bcc;
            }

            this.activeModal.close(payload);
        }
    }

    downloadAttachment(attachment: EmailAttachment): void {
        this.isLoading = true;
        this.actionsService.downloadAction(attachment.contextCode, attachment.contextId)
            .pipe(finalize(() => this.isLoading = false)).subscribe(res => {
            const cd = res.headers.get('content-disposition') ?? '';
            const filename = this.getFilenameFromContentDisposition(cd) ?? 'document.pdf';

            const blob = res.body!;
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;   // ✅ c’est ça qui impose le nom
            a.click();

            window.URL.revokeObjectURL(url);
        });
    }

    cancel() {
        this.activeModal.dismiss();
    }

    private readonly bccListValidator = (control: AbstractControl): ValidationErrors | null => {
        const invalidEntries = this.normalizeBcc(control.value).filter(email => !this.isValidEmail(email));
        if (invalidEntries.length === 0) {
            return null;
        }

        return {invalidBccList: true};
    };

    private normalizeBcc(raw: unknown): string[] {
        if (!Array.isArray(raw)) {
            return [];
        }
        return raw
            .filter((entry): entry is string => typeof entry === 'string')
            .map(entry => entry.trim())
            .filter(entry => entry.length > 0);
    }

    private isValidEmail(email: string): boolean {
        return new FormControl(email, [Validators.email]).valid;
    }

    private getFilenameFromContentDisposition(cd: string): string | null {
        // gère filename*=UTF-8''... et filename="..."
        const utf8 = cd.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
        if (utf8?.[1]) {
            return decodeURIComponent(utf8[1]);
        }

        const ascii = cd.match(/filename\s*=\s*"([^"]+)"/i) ?? cd.match(/filename\s*=\s*([^;]+)/i);
        return ascii?.[1]?.trim() ?? null;
    }
}
