import {Component, inject, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
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

@Component({
               templateUrl: './email-dialog.component.html',
               styleUrl: './email-dialog.component.scss',
               imports: [SharedModule, FormsModule, EditorModule, ReactiveFormsModule, TextBoxComponent, Editor, ButtonBoxComponent]
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

    constructor(private fb: FormBuilder, public activeModal: NgbActiveModal) {
    }

    ngOnInit() {
        this.form = this.fb.group({
                                      from: [{
                                          value: this.template.from,
                                          disabled: true
                                      }, [Validators.required, Validators.email]],
                                      to: [this.template.to, [Validators.required, Validators.email]],
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
            this.activeModal.close(this.form.getRawValue() as EmailMessage);
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
