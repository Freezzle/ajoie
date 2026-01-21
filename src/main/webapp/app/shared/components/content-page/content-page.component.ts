import {Component} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';

@Component({
               selector: 'app-content-page',
               imports: [
                   TranslateModule
               ],
               templateUrl: './content-page.component.html',
               styleUrl: './content-page.component.scss'
           })
export class ContentPageComponent {
}
