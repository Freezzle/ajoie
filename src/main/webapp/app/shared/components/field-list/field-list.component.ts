import {ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
               selector: 'app-field-list',
               standalone: true,
               templateUrl: './field-list.component.html',
               styleUrl: './field-list.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class FieldListComponent {}
