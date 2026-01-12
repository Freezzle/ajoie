import {Component, input} from '@angular/core';
import {PrimeTemplate} from 'primeng/api';
import {Card} from 'primeng/card';

@Component({
               selector: 'app-card',
               imports: [
                   PrimeTemplate,
                   Card
               ],
               templateUrl: './card.component.html',
               styleUrl: './card.component.scss'
           })
export class CardComponent {
    showHeader = input<boolean>(true);
}
