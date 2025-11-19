import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {TranslateModule} from '@ngx-translate/core';

import FindLanguageFromKeyPipe from './language/find-language-from-key.pipe';
import TranslateDirective from './language/translate.directive';
import {QuillModule} from 'ngx-quill';
import {ToastModule} from "primeng/toast";

/**
 * Application wide Module
 */
@NgModule({
    imports: [FindLanguageFromKeyPipe, TranslateDirective,
        QuillModule.forRoot()],
    exports: [
        CommonModule,
        NgbModule,
        FontAwesomeModule,
        TranslateModule,
        FindLanguageFromKeyPipe,
        TranslateDirective
    ],
})
export default class SharedModule {
}
