import {Pipe, PipeTransform} from '@angular/core';
import {Status} from '../../admin/enumerations/status.model';

@Pipe({
    standalone: true,
    name: 'colorStatus',
})
export default class ColorStatusPipe implements PipeTransform {
    transform(value: string | Status | null | undefined): string {
        if (value === Status.ACCEPTED) {
            return 'green-icon';
        } else if (value === Status.REFUSED) {
            return 'red-icon';
        } else if (value === Status.IN_VERIFICATION) {
            return 'grey-icon';
        } else if (value === Status.CANCELED) {
            return 'red-icon';
        } else {
            return '';
        }
    }
}
