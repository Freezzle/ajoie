import {Directive, ElementRef, HostListener, inject, input} from '@angular/core';
import {Popover} from 'primeng/popover';

/**
 * Déclenche un popover explicatif sur une icône de pied de ligne.
 *
 * Sur un appareil qui gère le survol (desktop), le popover s'ouvre au survol de
 * l'icône. Sur un écran tactile, il s'ouvre au clic, comme l'icône « ? » du menu
 * d'actions. Le clic est toujours stoppé pour ne pas déclencher la navigation de
 * la ligne.
 */
@Directive({
               selector: '[appFootHelp]'
           })
export class FootHelpDirective {
    /** Popover (PrimeNG) à piloter, fourni via une référence de template. */
    readonly popover = input.required<Popover>({alias: 'appFootHelp'});

    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly supportsHover =
        typeof window !== 'undefined' && !!window.matchMedia?.('(hover: hover)').matches;

    @HostListener('mouseenter', ['$event'])
    onEnter(event: Event): void {
        if (!this.supportsHover) {
            return;
        }
        this.popover().show(event, this.host.nativeElement);
    }

    @HostListener('mouseleave')
    onLeave(): void {
        if (!this.supportsHover) {
            return;
        }
        this.popover().hide();
    }

    @HostListener('click', ['$event'])
    onClick(event: Event): void {
        event.stopPropagation();
        if (this.supportsHover) {
            return;
        }
        this.popover().toggle(event, this.host.nativeElement);
    }
}
