import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'findLanguageFromKey',
})
export default class FindLanguageFromKeyPipe implements PipeTransform {
  private readonly languages: { [key: string]: { name: string; rtl?: boolean } } = {
    fr: { name: 'Français' },
    en: { name: 'English' },
    de: { name: 'Deutsch' },
    // jhipster-needle-i18n-language-key-pipe - JHipster will add/remove languages in this object
  };

  transform(lang: string): string {
    return this.languages[lang].name;
  }
}
