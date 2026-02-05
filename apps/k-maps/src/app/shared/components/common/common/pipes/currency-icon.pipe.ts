import { Pipe, PipeTransform } from '@angular/core';

const CURRENCY_ICONS = {
  EUR: 'fa-euro-sign',
  GBP: 'fa-pound-sign',
  AUD: 'fa-dollar-sign',
  TRY: 'fa-lira-sign',
  RUB: 'fa-ruble-sign',
  USD: 'fa-dollar-sign'
};

@Pipe({
  name: 'currencyicon',
  pure: true
})
export class McitCurrencyIconPipe implements PipeTransform {
  transform(value: any, ...args: any[]): any {
    const d = CURRENCY_ICONS['EUR'];
    if (!value) {
      return d;
    }
    const c = CURRENCY_ICONS[value];
    return c ? c : 'NO_SYMBOL';
  }
}
