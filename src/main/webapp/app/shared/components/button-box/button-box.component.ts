import {Component, EventEmitter, Input, Output} from '@angular/core';

import SharedModule from '../../shared.module';
import {Button} from 'primeng/button';
import {RouterLink} from '@angular/router';
import {convertSeverity, SEVERITY} from '../../utils/severity';

@Component({
               imports: [SharedModule, Button, RouterLink],
               selector: 'button-box',
               templateUrl: './button-box.component.html'
           })
export class ButtonBoxComponent {
    @Input()
    modeLink: boolean = false;
    @Input()
    links: string[] = [];
    @Input()
    routerLink: string | string[] | null = null;
    @Input()
    isDisabled: boolean = false;
    @Input()
    translateKey!: string;
    @Input()
    faIcon: string | null = null;
    @Input()
    faIconAnimation: 'spin' | undefined = undefined;
    @Input()
    primeIcon: string | undefined = undefined;
    @Input()
    isSubmit: boolean = false;
    @Input()
    type: SEVERITY = 'primary';
    @Input()
    showText: boolean = true;
    @Input()
    rounded: boolean = false;
    @Input()
    badge: string | undefined = undefined;
    @Input()
    badgeSeverity: 'success' | 'secondary' | 'info' | 'warn' | 'danger' | undefined = undefined;
    @Input()
    loading: boolean = false;

    @Output()
    clickedEvent = new EventEmitter<HTMLElement>();

    get colorButton() {
        return convertSeverity(this.type);
    }

    onClick(event: MouseEvent): void {
        this.clickedEvent.emit(event.currentTarget as HTMLElement);
    }
}
