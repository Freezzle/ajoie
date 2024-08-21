import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
          standalone: true,
          name: 'lockBoolean',
      })
export default class LockBooleanPipe implements PipeTransform {
    transform(value: boolean | null | undefined): string {
        return value ? 'lock' : 'lock-open';
    }
}
