import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';

import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import SharedModule from '../../shared.module';
import {Button} from "primeng/button";
import {RouterLink} from "@angular/router";

@Component({
    imports: [FaIconComponent, SharedModule, Button, RouterLink],
    selector: 'button-box',
    templateUrl: './button-box.component.html'
})
export class ButtonBoxComponent {
    @ViewChild('btn') btn!: ElementRef<HTMLButtonElement>;

    @Input()
    modeLink: boolean = false;
    @Input()
    links: string[] = [];
    @Input()
    isDisabled: boolean = false;
    @Input()
    translateKey!: string;
    @Input()
    faIcon: string | null = null;
    @Input()
    faIconAnimation: 'spin' | undefined = undefined;
    @Input()
    isSubmit: boolean = false;
    @Input()
    type: 'primary' | 'secondary' | 'warning' | 'danger' | 'success' = 'primary';
    @Input()
    showText: boolean = true;

    @Output()
    clickedEvent = new EventEmitter<HTMLElement>();

    onClick(): void {
        this.clickedEvent.emit(this.btn.nativeElement);
    }

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
}
