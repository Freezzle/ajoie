import {Pipe, PipeTransform} from '@angular/core';

import dayjs from 'dayjs/esm';

@Pipe({
    standalone: true,
    name: 'formatMediumDatetime',
})
export default class FormatMediumDatetimePipe implements PipeTransform {
    transform(day: dayjs.Dayjs | null | undefined): string {
        if (day && day instanceof dayjs) {
            return day.format('DD.MM.YYYY HH:mm:ss');
        } else {
            return day ? dayjs(day).format('DD.MM.YYYY HH:mm:ss') : '';
        }
    }
}
