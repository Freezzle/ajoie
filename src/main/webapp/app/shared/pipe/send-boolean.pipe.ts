import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'sendBoolean',
})
export default class SendBooleanPipe implements PipeTransform {
  transform(value: boolean | null | undefined): string {
    return value ? 'envelope-circle-check' : 'file-import';
  }
}
