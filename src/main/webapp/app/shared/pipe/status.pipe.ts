import { Pipe, PipeTransform } from '@angular/core';
import { Status } from '../../entities/enumerations/status.model';

@Pipe({
  standalone: true,
  name: 'status',
})
export default class StatusPipe implements PipeTransform {
  transform(value: string | Status | null | undefined): string {
    if (value === Status.ACCEPTED) {
      return 'circle';
    } else if (value === Status.REFUSED) {
      return 'circle';
    } else if (value === Status.IN_VERIFICATION) {
      return 'circle-half-stroke';
    } else if (value === Status.CANCELED) {
      return 'slash';
    } else {
      return '';
    }
  }
}
