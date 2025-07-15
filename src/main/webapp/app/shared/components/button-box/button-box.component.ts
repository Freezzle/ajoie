import {Component, EventEmitter, Input, Output} from '@angular/core';

import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import SharedModule from '../../shared.module';

@Component({
    imports: [FaIconComponent, SharedModule],
    selector: 'button-box',
    templateUrl: './button-box.component.html'
})
export class ButtonBoxComponent {
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
    clickedEvent = new EventEmitter<void>();

    onClick(): void {
        this.clickedEvent.emit();
    }

    get colorButton() {
        if (this.type === 'primary') {
            return 'btn-primary';
        } else if (this.type === 'secondary') {
            return 'btn-secondary';
        } else if (this.type === 'warning') {
            return 'btn-warning';
        } else if (this.type === 'danger') {
            return 'btn-danger';
        } else if (this.type === 'success') {
            return 'btn-success';
        } else {
            return 'btn-primary';
        }
    }
}
