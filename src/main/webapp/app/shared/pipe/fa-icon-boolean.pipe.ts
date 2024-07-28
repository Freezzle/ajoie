import { Pipe, PipeTransform } from '@angular/core';

import dayjs from 'dayjs/esm';

@Pipe({
  standalone: true,
  name: 'faIconBoolean',
})
export default class FaIconBooleanPipe implements PipeTransform {
  transform(value: boolean | null | undefined): string {
    return value ? 'check' : 'times';
  }
}
