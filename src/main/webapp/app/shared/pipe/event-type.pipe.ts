import{Pipe, PipeTransform}from '@angular/core';
import {Status}from '../../admin/enumerations/status.model';

@Pipe({
standalone: true,
name: 'eventType',
})
export default class EventTypePipe implements PipeTransform {
transform(value: string | Status | null | undefined): string {
    if (value === 'EMAIL') {
      return 'envelope';
    } else {
      return 'bolt';
    }
  }
}
