import {Pipe, PipeTransform} from '@angular/core';
import {Status} from '../../admin/enumerations/status.model';

@Pipe({
          standalone: true,
          name: 'status'
      })
export default class StatusPipe implements PipeTransform {
    transform(value: string | Status | null | undefined): string {
        if (value === Status.ACCEPTED) {
            return 'check';
        } else if (value === Status.REFUSED) {
            return 'ban';
        } else if (value === Status.IN_VERIFICATION) {
            return 'hourglass-half';
        } else if (value === Status.CANCELED) {
            return 'times-circle';
        } else if (value === Status.VALIDATED) {
            return 'calendar-check';
        } else if (value === Status.CLOSED) {
            return 'piggy-bank';
        } else {
            return '';
        }
    }
}
