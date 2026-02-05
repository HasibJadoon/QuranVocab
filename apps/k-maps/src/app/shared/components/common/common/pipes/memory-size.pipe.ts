import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { Subscription } from 'rxjs';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';

const SIZES: { min: number; nameKey: string; transform: (value: number) => number }[] = [
  {
    min: Math.pow(1024, 3),
    nameKey: 'MEMORY_SIZE.GB',
    transform: (value) => value / Math.pow(1024, 3)
  },
  {
    min: Math.pow(1024, 2),
    nameKey: 'MEMORY_SIZE.MB',
    transform: (value) => value / Math.pow(1024, 2)
  },
  {
    min: 1024,
    nameKey: 'MEMORY_SIZE.KB',
    transform: (value) => value / 1024
  },
  {
    min: 0,
    nameKey: 'MEMORY_SIZE.B',
    transform: (value) => value
  }
];

@Pipe({
  name: 'memorysize',
  pure: false
})
export class McitMemorySizePipe implements PipeTransform, OnDestroy {
  private value: string;

  private lastValue: number;

  private onLangChange: Subscription;

  constructor(private translateService: TranslateService, private changeDectectorRef: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this._dispose();
  }

  transform(value: number): any {
    if (!value) {
      return value;
    }

    if (value === this.lastValue) {
      return this.value;
    }

    this.lastValue = value;

    this.updateValue(value, this.translateService.currentLang);

    this._dispose();

    if (!this.onLangChange) {
      this.onLangChange = this.translateService.onLangChange.subscribe((event: LangChangeEvent) => {
        this.updateValue(value, event.lang);
      });
    }

    return this.value;
  }

  private updateValue(value: number, lang: string): void {
    const size = SIZES.find((s) => value >= s.min);
    if (!size) {
      this.value = value.toString();
    } else {
      const v = size.transform(value);
      this.value = this.translateService.instant(size.nameKey, { value: Math.round(v * 100) / 100 });
    }

    this.changeDectectorRef.markForCheck();
  }

  private _dispose(): void {
    if (typeof this.onLangChange !== 'undefined') {
      this.onLangChange.unsubscribe();
      this.onLangChange = undefined;
    }
  }
}
