import { CountryCode } from 'libphonenumber-js';

export interface Country {
  code: CountryCode;
  name: string;
  flag: string;
}

export interface CountryPhone extends Country {
  indicatif: string;
}

export const COUNTRIES: Country[] = [
  { code: 'AX', name: 'Aland Islands', flag: 'ax' },
  { code: 'AL', name: 'Albania', flag: 'al' },
  { code: 'AD', name: 'Andorra', flag: 'ad' },
  { code: 'AT', name: 'Austria', flag: 'at' },
  { code: 'AR', name: 'Argentina', flag: 'ar' },
  { code: 'BY', name: 'Belarus', flag: 'by' },
  { code: 'BE', name: 'Belgium', flag: 'be' },
  { code: 'BA', name: 'Bosnia and Herzegovina', flag: 'ba' },
  { code: 'BG', name: 'Bulgaria', flag: 'bg' },
  { code: 'BR', name: 'Brazil', flag: 'br' },
  { code: 'CN', name: 'China', flag: 'cn' },
  { code: 'HR', name: 'Croatia', flag: 'hr' },
  { code: 'CY', name: 'Cyprus', flag: 'cy' },
  { code: 'CZ', name: 'Czech Republic', flag: 'cz' },
  { code: 'DK', name: 'Denmark', flag: 'dk' },
  { code: 'EE', name: 'Estonia', flag: 'ee' },
  { code: 'FO', name: 'Faroe Islands', flag: 'fo' },
  { code: 'FI', name: 'Finland', flag: 'fi' },
  { code: 'MK', name: 'Former Yugoslav Republic of Macedonia', flag: 'mk' },
  { code: 'FR', name: 'France', flag: 'fr' },
  { code: 'DE', name: 'Germany', flag: 'de' },
  { code: 'GI', name: 'Gibraltar', flag: 'gi' },
  { code: 'GR', name: 'Greece', flag: 'gr' },
  { code: 'GG', name: 'Guernsey', flag: 'gg' },
  { code: 'VA', name: 'Holy See', flag: 'va' },
  { code: 'HU', name: 'Hungary', flag: 'hu' },
  { code: 'IS', name: 'Iceland', flag: 'is' },
  { code: 'IE', name: 'Ireland', flag: 'ie' },
  { code: 'IM', name: 'Isle of Man', flag: 'im' },
  { code: 'IT', name: 'Italy', flag: 'it' },
  { code: 'JE', name: 'Jersey', flag: 'je' },
  { code: 'LV', name: 'Latvia', flag: 'lv' },
  { code: 'LI', name: 'Liechtenstein', flag: 'li' },
  { code: 'LT', name: 'Lithuania', flag: 'lt' },
  { code: 'LU', name: 'Luxembourg', flag: 'lu' },
  { code: 'MT', name: 'Malta', flag: 'mt' },
  { code: 'MD', name: 'Moldova', flag: 'md' },
  { code: 'MC', name: 'Monaco', flag: 'mc' },
  { code: 'ME', name: 'Montenegro', flag: 'me' },
  { code: 'NL', name: 'Netherlands', flag: 'nl' },
  { code: 'NO', name: 'Norway', flag: 'no' },
  { code: 'PL', name: 'Poland', flag: 'pl' },
  { code: 'PT', name: 'Portugal', flag: 'pt' },
  { code: 'RO', name: 'Romania', flag: 'ro' },
  { code: 'RU', name: 'Russia', flag: 'ru' },
  { code: 'SM', name: 'San Marino', flag: 'sm' },
  { code: 'RS', name: 'Serbia', flag: 'rs' },
  { code: 'SK', name: 'Slovakia', flag: 'sk' },
  { code: 'SI', name: 'Slovenia', flag: 'si' },
  { code: 'ES', name: 'Spain', flag: 'es' },
  { code: 'SJ', name: 'Svalbard and Jan Mayen', flag: 'sj' },
  { code: 'SE', name: 'Sweden', flag: 'se' },
  { code: 'CH', name: 'Switzerland', flag: 'ch' },
  { code: 'TH', name: 'Thaïlande', flag: 'th' },
  { code: 'TR', name: 'Turkey', flag: 'tr' },
  { code: 'UA', name: 'Ukraine', flag: 'ua' },
  { code: 'AE', name: 'United Arab Emirates', flag: 'ae' },
  { code: 'GB', name: 'United Kingdom', flag: 'gb' },
  { code: 'MA', name: 'Maroco', flag: 'ma' },
  { code: 'SA', name: 'Saudi Arabia', flag: 'sa' },
  { code: 'KR', name: 'Korea', flag: 'kr' }
];
