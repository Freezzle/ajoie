import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
          standalone: true,
          name: 'colorBool'
      })
export default class ColorBoolPipe implements PipeTransform {
    transform(value: boolean | null | undefined): string {
        return value ? 'text-primary' : 'text-danger';
    }
}
