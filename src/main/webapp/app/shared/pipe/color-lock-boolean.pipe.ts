import { Pipe, PipeTransform } from '@angular/core';

import dayjs from 'dayjs/esm';

@Pipe({
  standalone: true,
  name: 'colorLockBoolean',
})
export default class ColorLockBooleanPipe implements PipeTransform {
  transform(value: boolean | null | undefined): string {
    return value ? 'orange-icon' : 'grey-icon';
  }
}
