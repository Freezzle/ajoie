import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { EmailMessage } from './email-message';
import { QuillEditorComponent } from 'ngx-quill';
import { TextBoxComponent } from '../components/text-box/text-box.component';

@Component({
  standalone: true,
  templateUrl: './email-dialog.component.html',
  styleUrl: './email-dialog.component.scss',
  imports: [SharedModule, FormsModule, ReactiveFormsModule, QuillEditorComponent, TextBoxComponent],
})
export class EmailDialogComponent implements OnInit {

  @Input() template!: EmailMessage;
  @Input() context!: string;
  @Input() entityId!: number;

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ header: [1, 2, 3, false] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ['link'],
      ['clean'],
    ],
  };

  form!: FormGroup;

  constructor(private fb: FormBuilder, public activeModal: NgbActiveModal) {
  }

  ngOnInit() {
    this.form = this.fb.group({
      from: [{ value: this.template.from, disabled: true }, [Validators.required, Validators.email]],
      to: [this.template.to, [Validators.required, Validators.email]],
      subject: [this.template.subject, Validators.required],
      body: [this.template.body, Validators.required],
    });
  }

  submit() {
    if (this.form.valid) {
      this.activeModal.close(this.form.getRawValue() as EmailMessage);
    }
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
