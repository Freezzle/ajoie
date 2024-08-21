import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
          standalone: true,
          name: 'checkBool',
      })
export default class CheckBoolPipe implements PipeTransform {
    transform(value: boolean | null | undefined): string {
        return value ? 'check' : 'times';
    }
}
