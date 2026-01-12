import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {MenuItem} from 'primeng/api';
import {MenuModule} from 'primeng/menu';
import {CommonModule} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {TranslateModule} from '@ngx-translate/core';

@Component({
               selector: 'menu-box',
               imports: [CommonModule, MenuModule, ButtonModule, FaIconComponent, TranslateModule],
               templateUrl: './menu-box.component.html',
               styleUrl: './menu-box.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class MenuBoxComponent {
    @Input({required: true}) items: MenuItem[] = [];
    @Input() type: 'primary' | 'secondary' | 'warning' | 'danger' | 'success' = 'primary';
    @Input() buttonTranslateKey: string | null = null;
    @Input() buttonIcon?: string;
    @Input() buttonDisabled = false;
    @Input() appendTo: any = 'body';

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
