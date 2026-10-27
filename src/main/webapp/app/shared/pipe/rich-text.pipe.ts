import {Pipe, PipeTransform} from '@angular/core';

import {prepareRichTextHtml} from '../utils/rich-text.util';

/**
 * Normalise le HTML de l'éditeur riche avant injection via `[innerHTML]`
 * (voir `rich-text.util.ts` : les espaces insécables empêchent les retours à la ligne).
 */
@Pipe({
          standalone: true,
          name: 'richText'
      })
export default class RichTextPipe implements PipeTransform {
    transform(value: string | null | undefined): string | null {
        return prepareRichTextHtml(value);
    }
}
