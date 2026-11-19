import {ChangeDetectionStrategy, Component, input} from '@angular/core';

import {EmptyValuePipe} from './empty-value.pipe';

@Component({
               selector: 'app-field-row',
               standalone: true,
               imports: [EmptyValuePipe],
               templateUrl: './field-row.component.html',
               styleUrl: './field-row.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class FieldRowComponent {
    readonly value = input<unknown>(undefined);
    readonly empty = input<boolean>(false);
}
