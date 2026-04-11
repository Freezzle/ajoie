import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {ITaskInstance} from '../model/task-instance.interface';
import {SubtaskRowComponent} from './subtask-row.component';
import {MenuBoxComponent} from '../../../shared/components/menu-box/menu-box.component';
import DaysRelativePipe from '../../../shared/date/days-relative.pipe';
import FormatMediumDatePipe from '../../../shared/date/format-medium-date.pipe';
import {TimeSincePipe} from '../../../shared/pipe/time-since.pipe';
import {Tag} from 'primeng/tag';
import {Checkbox} from 'primeng/checkbox';
import {Popover} from 'primeng/popover';

@Component({
    selector: 'app-subtask-flat-row',
    templateUrl: './subtask-flat-row.component.html',
    styleUrls: ['./subtask-flat-row.component.scss'],
    imports: [
        CommonModule,
        FormsModule,
        TranslateModule,
        MenuBoxComponent,
        DaysRelativePipe,
        FormatMediumDatePipe,
        TimeSincePipe,
        Tag,
        Checkbox,
        Popover
    ]
})
export class SubtaskFlatRowComponent extends SubtaskRowComponent {
    /** Tâche parente — affichée en badge discret dans la vue flat */
    @Input() parentTask!: ITaskInstance;
}
