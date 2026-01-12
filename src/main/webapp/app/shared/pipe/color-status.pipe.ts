import {Pipe, PipeTransform} from '@angular/core';
import {Status} from '../../admin/enumerations/status.model';

@Pipe({
          standalone: true,
          name: 'colorStatus'
      })
export default class ColorStatusPipe implements PipeTransform {
    transform(value: string | Status | null | undefined): string {
        if (value === Status.ACCEPTED || value === Status.VALIDATED) {
            return 'text-primary';
        } else if (value === Status.REFUSED || value === Status.CANCELED) {
            return 'text-danger';
        } else if (value === Status.IN_VERIFICATION) {
            return 'text-secondary';
        } else if (value === Status.CLOSED) {
            return 'golden-icon';
        } else {
            return '';
        }
    }
}
