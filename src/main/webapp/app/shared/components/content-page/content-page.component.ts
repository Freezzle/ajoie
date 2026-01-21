import {Component} from '@angular/core';
import {Menubar} from 'primeng/menubar';
import {CardComponent} from '../card/card.component';
import {TranslateModule} from '@ngx-translate/core';

@Component({
               selector: 'app-content-page',
               imports: [
                   Menubar,
                   CardComponent,
                   TranslateModule
               ],
               templateUrl: './content-page.component.html',
               styleUrl: './content-page.component.scss'
           })
export class ContentPageComponent {
}
