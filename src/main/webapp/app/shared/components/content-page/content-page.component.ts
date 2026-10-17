import {Component} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
               selector: 'app-content-page',
               imports: [
                   TranslatePipe
               ],
               templateUrl: './content-page.component.html',
               styleUrl: './content-page.component.scss'
           })
export class ContentPageComponent {
}
