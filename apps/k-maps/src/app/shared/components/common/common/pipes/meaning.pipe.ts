import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import * as lodash from 'lodash';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'meaning',
  pure: false
})
export class McitMeaningPipe implements PipeTransform, OnDestroy {
  private value: string;

  private lastValue: string;
  private lastArgs: string;

  private onLangChange: Subscription;

  constructor(private translateService: TranslateService, private changeDectectorRef: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this._dispose();
  }

  transform(value: any, ...args: any[]): any {
    if (!value || !(value instanceof Object)) {
      return value;
    }

    const jvalue = JSON.stringify(value);
    const jargs = JSON.stringify(args);

    if (jvalue === this.lastValue && jargs === this.lastArgs) {
      return this.value;
    }

    this.lastValue = jvalue;
    this.lastArgs = jargs;

    this.updateValue(value, args[0], this.translateService.currentLang);

    this._dispose();

    if (!this.onLangChange) {
      this.onLangChange = this.translateService.onLangChange.subscribe((event: LangChangeEvent) => {
        this.updateValue(value, args[0], event.lang);
      });
    }

    return this.value;
  }

  private updateValue(value: any, defaultLang: string, lang: string): void {
    let v = lodash.compact([lang, defaultLang, 'default', 'en', Object.keys(value)[0]]).find((l) => value[l]);
    if (!v) {
      v = '!NOTHING_LABEL!';
    } else {
      v = value[v];
    }
    this.value = v;

    this.changeDectectorRef.markForCheck();
  }

  private _dispose(): void {
    if (typeof this.onLangChange !== 'undefined') {
      this.onLangChange.unsubscribe();
      this.onLangChange = undefined;
    }
  }
}
