import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {MenuItem} from 'primeng/api';
import {MenuModule} from 'primeng/menu';
import {CommonModule} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {TranslateModule} from '@ngx-translate/core';
import {ButtonBoxComponent} from '../button-box/button-box.component';
import {SEVERITY} from '../../utils/severity';

@Component({
               selector: 'menu-box',
               imports: [CommonModule, MenuModule, ButtonModule, TranslateModule, ButtonBoxComponent],
               templateUrl: './menu-box.component.html',
               styleUrl: './menu-box.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class MenuBoxComponent {
    @Input({required: true}) items: MenuItem[] = [];
    @Input() type: SEVERITY = 'primary';
    @Input() buttonTranslateKey: string | null = null;
    @Input() buttonIcon?: string;
    @Input() buttonDisabled = false;
    @Input() appendTo: any = 'body';
}
