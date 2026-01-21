import {ChangeDetectionStrategy, Component, computed, Input} from '@angular/core';
import {MenuItem} from 'primeng/api';
import {MenuModule} from 'primeng/menu';
import {CommonModule} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {TranslateModule} from '@ngx-translate/core';
import {convertSeverity, SEVERITY} from '../../utils/severity';
import {SplitButton} from 'primeng/splitbutton';

@Component({
               selector: 'split-menu-box',
               imports: [CommonModule, MenuModule, ButtonModule, TranslateModule, SplitButton],
               templateUrl: './split-menu-box.component.html',
               styleUrl: './split-menu-box.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class SplitMenuBoxComponent {
    @Input({required: true}) items: MenuItem[] = [];
    @Input() type: SEVERITY = 'primary';
    @Input() buttonIcon?: string;
    @Input() buttonDisabled = false;
    @Input() appendTo: any = 'body';
    protected readonly convertSeverity = convertSeverity;

    // Extracted primary action from first item
    readonly primaryAction = computed(() => {
        const itemsList = this.items;
        return itemsList && itemsList.length > 0 ? itemsList[0] : null;
    });

    // Remaining dropdown items (without the first one)
    readonly dropdownItems = computed(() => {
        const itemsList = this.items;
        return itemsList && itemsList.length > 1 ? itemsList.slice(1) : [];
    });

    // Computed label: use first item's label or fallback to icon
    readonly buttonLabel = computed(() => {
        const primary = this.primaryAction();
        return primary?.label ?? undefined;
    });

    // Execute the primary action
    onPrimaryClick(): void {
        const primary = this.primaryAction();
        if (primary?.command) {
            primary.command({});
        }
    }
}
