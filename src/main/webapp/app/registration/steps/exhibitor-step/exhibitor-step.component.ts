import {Component, Input} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';

import SharedModule from '../../../shared/shared.module';
import {AddressFormComponent} from '../../../shared/components/address-form/address-form.component';
import {CheckboxBoxComponent} from '../../../shared/components/checkbox-box/checkbox-box.component';
import {SelectBoxComponent} from '../../../shared/components/select-box/select-box.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {ExhibitorFormGroup} from '../../registration-form.service';

@Component({
               selector: 'app-exhibitor-step',
               imports: [
                   SharedModule,
                   ReactiveFormsModule,
                   AddressFormComponent,
                   CheckboxBoxComponent,
                   SelectBoxComponent,
                   TextBoxComponent
               ],
               templateUrl: './exhibitor-step.component.html',
               styleUrl: './exhibitor-step.component.scss'
           })
export class ExhibitorStepComponent {
    @Input({required: true}) form!: ExhibitorFormGroup;
    @Input() emailReadOnly: boolean = false;

    readonly languages = ['fr', 'de', 'en'];

    formatterLanguage = (language: string): string => `exhibitor.language.list.${language}`;
}
