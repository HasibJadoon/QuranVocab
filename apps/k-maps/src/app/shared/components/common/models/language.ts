import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localeDe from '@angular/common/locales/de';
import localeEs from '@angular/common/locales/es';
import localeIt from '@angular/common/locales/it';
import localePt from '@angular/common/locales/pt';
import localeNe from '@angular/common/locales/ne';
import localeNl from '@angular/common/locales/nl';
import localePl from '@angular/common/locales/pl';
import localeRu from '@angular/common/locales/tr';
import localeCs from '@angular/common/locales/cs';
import localeTr from '@angular/common/locales/ru';
import localeZh from '@angular/common/locales/zh';
import localeLt from '@angular/common/locales/lt';
import localeTh from '@angular/common/locales/th';
import localeKo from '@angular/common/locales/ko';
import localeAr from '@angular/common/locales/ar';

export interface ILanguage {
  code: string;
  name: string;
  default: string;
}

export const LANGUAGES: ILanguage[] = [
  { code: 'fr', name: 'LANGUAGES.fr', default: 'Français' },
  { code: 'en', name: 'LANGUAGES.en', default: 'English' },
  { code: 'pt', name: 'LANGUAGES.pt', default: 'Português' },
  { code: 'de', name: 'LANGUAGES.de', default: 'Deutsch' },
  { code: 'it', name: 'LANGUAGES.it', default: 'Italiano' },
  { code: 'es', name: 'LANGUAGES.es', default: 'Español' },
  { code: 'nl', name: 'LANGUAGES.nl', default: 'Nederlands' },
  { code: 'pl', name: 'LANGUAGES.pl', default: 'Polski' },
  { code: 'ru', name: 'LANGUAGES.ru', default: 'русский' },
  { code: 'tr', name: 'LANGUAGES.tr', default: 'Türk' },
  { code: 'cs', name: 'LANGUAGES.cs', default: 'Česky' },
  { code: 'zh', name: 'LANGUAGES.zh', default: '中国人' },
  { code: 'lt', name: 'LANGUAGES.lt', default: 'Lietuvis' },
  { code: 'sk', name: 'LANGUAGES.sk', default: 'Slovák' },
  { code: 'hu', name: 'LANGUAGES.hu', default: 'Magyar' },
  { code: 'bg', name: 'LANGUAGES.bg', default: 'български' },
  { code: 'ar', name: 'LANGUAGES.ar', default: 'العربية' },
  { code: 'sl', name: 'LANGUAGES.sl', default: 'Slovenščina' },
  { code: 'hr', name: 'LANGUAGES.hr', default: 'Hrvatski' },
  { code: 'ro', name: 'LANGUAGES.ro', default: 'Română' },
  { code: 'uk', name: 'LANGUAGES.uk', default: 'Український' },
  { code: 'th', name: 'LANGUAGES.th', default: 'ภาษาไทย' },
  { code: 'ko', name: 'LANGUAGES.ko', default: '한국어' }
];

export class Meaning {
  en: string;
  fr: string;
  pt: string;
  de: string;
  it: string;
  es: string;
  nl: string;
  pl: string;
  ru: string;
  tr: string;
  cs: string;
  zh: string;
  lt: string;
  sk: string;
  hu: string;
  bg: string;
  ar: string;
  sl: string;
  hr: string;
  ro: string;
  uk: string;
  th: string;
  ko: string;
}

export function installLocales(): void {
  registerLocaleData(localeFr, 'fr');
  registerLocaleData(localeDe, 'de');
  registerLocaleData(localeEs, 'es');
  registerLocaleData(localeIt, 'it');
  registerLocaleData(localePt, 'pt');
  registerLocaleData(localeNe, 'ne');
  registerLocaleData(localeNl, 'nl');
  registerLocaleData(localePl, 'pl');
  registerLocaleData(localeRu, 'ru');
  registerLocaleData(localeTr, 'tr');
  registerLocaleData(localeCs, 'cs');
  registerLocaleData(localeZh, 'zh');
  registerLocaleData(localeLt, 'lt');
  registerLocaleData(localeLt, 'sk');
  registerLocaleData(localeLt, 'hu');
  registerLocaleData(localeLt, 'bg');
  registerLocaleData(localeLt, 'sl');
  registerLocaleData(localeLt, 'hr');
  registerLocaleData(localeLt, 'ro');
  registerLocaleData(localeLt, 'uk');
  registerLocaleData(localeTh, 'th');
  registerLocaleData(localeKo, 'ko');
  registerLocaleData(localeAr, 'ar');
}
