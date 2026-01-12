import {Pipe, PipeTransform} from '@angular/core';

import dayjs from 'dayjs/esm';
import {DATE_FORMAT} from '../../config/input.constants';

@Pipe({
          standalone: true,
          name: 'formatMediumDate'
      })
export default class FormatMediumDatePipe implements PipeTransform {
    transform(day: Date | string | dayjs.Dayjs | null | undefined): string {
        if (!day) {
            return '';
        }

        // Si c'est déjà un objet dayjs
        if (dayjs.isDayjs(day)) {
            return day.format(DATE_FORMAT);
        }

        // Sinon, on convertit (Date ou string)
        return dayjs(day).format(DATE_FORMAT);
    }
}
