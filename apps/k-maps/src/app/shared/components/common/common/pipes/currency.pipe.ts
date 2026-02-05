import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import * as lodash from 'lodash';
import { McitCurrencyService } from '../../services/currency.service';

@Pipe({
  name: 'currency',
  pure: false
})
export class McitCurrencyPipe implements PipeTransform, OnDestroy {
  private value: any;
  private lastValue: any;
  private onTranslateChange: Subscription;

  constructor(private currencyService: McitCurrencyService, private translateService: TranslateService, private changeDectectorRef: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this._dispose();
  }

  transform(value: number | number[], currencyCode?: string, display?: 'code' | 'symbol', digitsInfo?: string): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (value === this.lastValue) {
      return this.value;
    }

    this.lastValue = value;
    this.updateValue(value, this.translateService.currentLang, currencyCode, display, digitsInfo);
    this._dispose();

    if (!this.onTranslateChange) {
      this.onTranslateChange = this.translateService.onLangChange.subscribe((next) => {
        this.updateValue(value, next.lang, currencyCode, display, digitsInfo);
      });
    }

    return this.value;
  }

  private updateValue(value: any, lang: string, currencyCode: string = 'EUR', display: 'code' | 'symbol' = 'symbol', digitsInfo?: string): void {
    const nf = this.currencyService.getCurrencyFormat(lang, currencyCode, display, digitsInfo);

    if (lodash.isArray(value)) {
      this.value = value.map((v) => (this.value = nf.format(v)));
    } else {
      this.value = nf.format(value);
    }

    this.changeDectectorRef.markForCheck();
  }

  private _dispose(): void {
    if (typeof this.onTranslateChange !== 'undefined') {
      this.onTranslateChange.unsubscribe();
      this.onTranslateChange = undefined;
    }
  }
}
