import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'appEmptyValue', standalone: true})
export class EmptyValuePipe implements PipeTransform {
    transform(value: unknown): unknown {
        if (value === null || value === undefined || value === '') {
            return '—';
        }

        return value;
    }
}
