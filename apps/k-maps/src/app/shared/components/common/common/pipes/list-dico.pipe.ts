import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import * as lodash from 'lodash';

@Pipe({
  name: 'listdico',
  pure: false
})
export class McitListDicoPipe implements PipeTransform, OnDestroy {
  private value: string;

  private lastValue: string;
  private lastArgs: string;

  private onLangChange: Subscription;

  constructor(private translateService: TranslateService, private changeDectectorRef: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this._dispose();
  }

  transform(value: any, ...args: any[]): any {
    if (!value) {
      return value;
    }
    if (lodash.isArray(value)) {
      value = value.join(',');
    }
    if (!value || !lodash.isString(value)) {
      return value;
    }

    const jvalue = JSON.stringify(value);
    const jargs = JSON.stringify(args);

    if (jvalue === this.lastValue && jargs === this.lastArgs) {
      return this.value;
    }

    this.lastValue = jvalue;
    this.lastArgs = jargs;

    this.updateValue(value, args[0], args[1], this.translateService.currentLang);

    this._dispose();

    if (!this.onLangChange) {
      this.onLangChange = this.translateService.onLangChange.subscribe((event: LangChangeEvent) => {
        this.updateValue(value, args[0], args[1], event.lang);
      });
    }

    return this.value;
  }

  private updateValue(value: string, arg: any, forceUpperCase: boolean, lang: string): void {
    if (lodash.isObject(arg)) {
      this.updateObjectValue(value, arg, forceUpperCase, this.translateService.currentLang);
    } else {
      this.updateStringValue(value, arg, forceUpperCase, this.translateService.currentLang);
    }
  }

  private updateStringValue(value: string, prefix: string, forceUpperCase: boolean, lang: string): void {
    this.value = (forceUpperCase != null && forceUpperCase ? value.toUpperCase() : value)
      .split(',')
      .map((v) => (prefix ? this.translateService.instant(`${prefix}.${v}`) : v))
      .join(' | ');

    this.changeDectectorRef.markForCheck();
  }

  private updateObjectValue(value: string, list: object, forceUpperCase: boolean, lang: string): void {
    this.value = (forceUpperCase != null && forceUpperCase ? value.toUpperCase() : value)
      .split(',')
      .map((v) => {
        if (list && list[v]) {
          return this.translateService.instant(list[v]);
        }
        return v;
      })
      .join(' | ');

    this.changeDectectorRef.markForCheck();
  }

  private _dispose(): void {
    if (typeof this.onLangChange !== 'undefined') {
      this.onLangChange.unsubscribe();
      this.onLangChange = undefined;
    }
  }
}
