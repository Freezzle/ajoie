import { Pipe, PipeTransform } from '@angular/core';

import dayjs from 'dayjs/esm';

@Pipe({
  standalone: true,
  name: 'faIconColorBoolean',
})
export default class FaIconColorBooleanPipe implements PipeTransform {
  transform(value: boolean | null | undefined): string {
    return value ? 'color:Green' : 'color:Tomato';
  }
}
