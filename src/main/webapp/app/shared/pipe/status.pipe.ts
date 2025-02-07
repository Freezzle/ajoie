import { Pipe, PipeTransform } from '@angular/core';
import { Status } from '../../admin/enumerations/status.model';

@Pipe({
  standalone: true,
  name: 'status',
})
export default class StatusPipe implements PipeTransform {
  transform(value: string | Status | null | undefined): string {
    if (value === Status.ACCEPTED) {
      return 'circle-check';
    } else if (value === Status.REFUSED) {
      return 'ban';
    } else if (value === Status.IN_VERIFICATION) {
      return 'eye';
    } else if (value === Status.CANCELED) {
      return 'trash-can';
    } else if (value === Status.PAID) {
      return 'piggy-bank';
    } else {
      return '';
    }
  }
}
