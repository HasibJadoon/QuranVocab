import { CURRENCIES, Currency } from '../models/currency';
import { Injectable } from '@angular/core';

export enum CurrencyEnum {
  EUR = '€',
  GBP = '£',
  AUD = '$',
  CZK = 'Kč',
  PLN = 'zł',
  TRY = '₺',
  RUB = '₽',
  CHF = 'CHF',
  USD = '$',
  RON = 'Lei',
  HUF = 'Ft',
  AED = 'د.إ',
  THB = '฿',
  SAR = 'SAR',
  CNY = '¥'
}

@Injectable({
  providedIn: 'root'
})
export class McitCurrencyService {
  private nfs: {
    [key: string]: Intl.NumberFormat;
  } = {};

  static getCurrencyOptionsInside(): { symbol: string; name: string }[] {
    return Object.keys(CurrencyEnum).map((key) => ({ symbol: CurrencyEnum[key] as string, name: key as string }));
  }

  static getCurrencyByCode(code_currency: string): Currency {
    if (code_currency) {
      for (const c of CURRENCIES) {
        if (c.code === code_currency) {
          return c;
        }
      }
    }
    return null;
  }

  static getCurrencySymbolByCode(code_currency: string): string {
    if (code_currency) {
      for (const c of this.getCurrencyOptionsInside()) {
        if (c.name === code_currency) {
          return c.symbol;
        }
      }
    }
    return null;
  }

  static getCurrencySymbol(code_currency: string): string {
    const currency: Currency = this.getCurrencyByCode(code_currency);
    return currency ? currency.symbol : this.getCurrencySymbolByCode(code_currency) ?? '';
  }

  static getCurrencyIconName(code_currency: string): string {
    const currency: Currency = this.getCurrencyByCode(code_currency);
    return currency ? currency.icon_name : '';
  }

  static convertValueFromOneCurrencyToAnother(value: number, code_starting_currency: string, code_currency_target: string): number {
    if (value && !(value === 0) && code_starting_currency && code_currency_target) {
      const starting_currency: Currency = this.getCurrencyByCode(code_starting_currency);
      const target_currency: Currency = this.getCurrencyByCode(code_currency_target);
      if (starting_currency && target_currency) {
        return Math.round((value * starting_currency.value_in_euro * 100) / target_currency.value_in_euro) / 100;
      }
    }
    return 0;
  }

  constructor() {}

  getCurrencyFormat(lang: string, currencyCode: string, display: 'code' | 'symbol', digitsInfo?: string): Intl.NumberFormat {
    const baseKey = `${lang}-${currencyCode}-${display}`;
    const key = digitsInfo ? baseKey + `-${digitsInfo}` : baseKey;
    const baseNumberFormat = {
      style: 'currency',
      currency: currencyCode || 'EUR',
      currencyDisplay: display || 'symbol'
    };

    if (this.nfs[key] == null) {
      if (digitsInfo) {
        this.nfs[key] = new Intl.NumberFormat(lang, {
          ...baseNumberFormat,
          minimumFractionDigits: parseInt(digitsInfo?.substring(2, 3), 10) || 2,
          maximumFractionDigits: parseInt(digitsInfo?.substring(4, 5), 10) || 2,
          minimumSignificantDigits: parseInt(digitsInfo?.substring(0, 1), 10) || 1
        });
      } else {
        this.nfs[key] = new Intl.NumberFormat(lang, baseNumberFormat);
      }
    }
    return this.nfs[key];
  }

  getCurrencyOptions(): { symbol: string; name: string }[] {
    return Object.keys(CurrencyEnum).map((key) => ({ symbol: CurrencyEnum[key] as string, name: key as string }));
  }
}
