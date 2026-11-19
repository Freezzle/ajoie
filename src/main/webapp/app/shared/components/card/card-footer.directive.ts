import {Directive} from '@angular/core';

/**
 * Marque le contenu réel du pied de l'`app-card`, placé à l'intérieur du slot
 * statique `appCardFooter`. Sa présence (réactive au `@if` de l'appelant) permet
 * à la carte de n'afficher la bande de pied que lorsqu'un pied existe vraiment.
 */
@Directive({
               selector: '[appCardFooterContent]',
               standalone: true
           })
export class CardFooterContentDirective {
}
