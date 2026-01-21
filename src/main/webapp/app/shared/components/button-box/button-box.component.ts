import {Component, EventEmitter, Input, Output} from '@angular/core';

import SharedModule from '../../shared.module';
import {Button} from 'primeng/button';
import {RouterLink} from '@angular/router';

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
    primeIcon: string | null = null;
    @Input()
    isSubmit: boolean = false;
    @Input()
    type: 'primary' | 'secondary' | 'warning' | 'danger' | 'success' = 'primary';
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
        if (this.type === 'primary') {
            return 'primary';
        } else if (this.type === 'secondary') {
            return 'secondary';
        } else if (this.type === 'warning') {
            return 'warn';
        } else if (this.type === 'danger') {
            return 'danger';
        } else if (this.type === 'success') {
            return 'success';
        } else {
            return 'primary';
        }
    }

    onClick(event: MouseEvent): void {
        this.clickedEvent.emit(event.currentTarget as HTMLElement);
    }
}
