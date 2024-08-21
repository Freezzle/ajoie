import {Pipe, PipeTransform} from '@angular/core';

import dayjs from 'dayjs/esm';

@Pipe({
          standalone: true,
          name: 'formatMediumDate',
      })
export default class FormatMediumDatePipe implements PipeTransform {
    transform(day: dayjs.Dayjs | string | null | undefined): string {
        if (day && day instanceof dayjs) {
            return day.format('DD.MM.YYYY');
        } else {
            return day ? dayjs(day).format('DD.MM.YYYY') : '';
        }
    }
}
