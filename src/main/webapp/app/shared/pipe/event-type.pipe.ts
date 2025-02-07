import { Pipe, PipeTransform } from '@angular/core';
import { Status } from '../../admin/enumerations/status.model';

@Pipe({
  standalone: true,
  name: 'eventType',
})
export default class EventTypePipe implements PipeTransform {
  transform(value: string | Status | null | undefined): string {
    if (value === 'EMAIL') {
      return 'envelope';
    } else if (value === 'PAYMENT') {
      return 'credit-card';
    } else if (value === 'PHONE_CALL') {
      return 'phone';
    } else if (value === 'DISCUSSION') {
      return 'comments';
    } else if (value === 'EVENT') {
      return 'bolt';
    } else {
      return 'tag';
    }
  }
}
