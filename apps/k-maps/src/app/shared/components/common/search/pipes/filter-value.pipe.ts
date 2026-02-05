import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { FilterType, IFilterConfig, IFilterCheckList, IFilterRadioList, IFilterSelectList, IFilterStringList, IFilterTags, IFilterCustom, IFilterDate } from '../search-options';
import { McitDateTranslatePipe } from '../../common/pipes/date-translate.pipe';
import { McitDateTimeService } from '../../services/date-time.service';
import * as lodash from 'lodash';
import { FilterValueKind } from '../search-model';

@Pipe({
  name: 'filtervalue',
  pure: false
})
export class McitFilterValuePipe implements PipeTransform, OnDestroy {
  private value: string;

  private lastValue: string;

  private dateTranslatePipe: McitDateTranslatePipe;

  private onLangChange: Subscription;

  constructor(private translateService: TranslateService, private dateTimeService: McitDateTimeService, private changeDectectorRef: ChangeDetectorRef) {
    this.dateTranslatePipe = new McitDateTranslatePipe(translateService, dateTimeService, changeDectectorRef);
  }

  ngOnDestroy(): void {
    this._dispose();
  }

  transform(value: any, ...args: any[]): any {
    if (lodash.isNil(value)) {
      return value;
    }

    const jvalue = JSON.stringify(value);

    if (jvalue === this.lastValue) {
      return this.value;
    }

    this.lastValue = jvalue;

    this.updateValue(value, args[0]);

    this._dispose();

    if (!this.onLangChange) {
      this.onLangChange = this.translateService.onLangChange.subscribe((event: LangChangeEvent) => {
        this.updateValue(value, args[0]);
      });
    }

    return this.value;
  }

  private updateValue(value: any, config: IFilterConfig): void {
    if (value === FilterValueKind.SET || value === FilterValueKind.UNSET) {
      this.value = this.translateService.instant(`SEARCH_FIELD.FILTERS.VALUE.${value.replace(new RegExp('\\$', 'g'), '')}`);
    } else {
      switch (config.type) {
        case FilterType.RADIO_LIST:
          this.value = this.toStringFromRadioList(value, config);
          break;
        case FilterType.SELECT_LIST:
          this.value = this.toStringFromSelectList(value, config);
          break;
        case FilterType.ASYNC_SELECT_LIST:
          this.value = this.toStringFromAsyncSelectList(value, config);
          break;
        case FilterType.ASYNC_CHECK_LIST:
          this.value = this.toStringFromAsyncCheckList(value, config);
          break;
        case FilterType.CHECK_LIST:
          this.value = this.toStringFromCheckList(value, config);
          break;
        case FilterType.TEXT:
          this.value = this.toStringFromText(value, config);
          break;
        case FilterType.NUMBER:
          this.value = this.toStringFromNumber(value, config);
          break;
        case FilterType.SIMPLE_NUMBER:
          this.value = this.toStringFromSimpleNumber(value, config);
          break;
        case FilterType.DATE:
        case FilterType.REDUCED_DATE:
          this.value = this.toStringFromDate(value, config);
          break;
        case FilterType.SIMPLE_DATE:
          this.value = this.toStringFromSimpleDate(value, config);
          break;
        case FilterType.AUTOCOMPLETE:
          this.value = this.toStringFromAutocomplete(value, config);
          break;
        case FilterType.CUSTOM:
          this.value = this.toStringFromCustom(value, config);
          break;
        case FilterType.TAGS:
          this.value = this.toStringFromTags(value, config);
          break;
        case FilterType.STRINGLIST:
          this.value = this.toStringFromStringList(value, config);
          break;
        case FilterType.MULTIAUTOCOMPLETE:
          this.value = this.toStringFromMultiAutocomplete(value, config);
          break;
      }
    }

    if (this.changeDectectorRef) {
      this.changeDectectorRef.markForCheck();
    }
  }

  private toStringFromRadioList(value: any, config: IFilterRadioList): string {
    if (!value) {
      return value;
    }
    const res = config.radioList.values.find((v) => v.code === value);
    return res ? (res.ignoreTranslate ? res.nameKey : this.translateService.instant(res.nameKey, res.params)) : value;
  }

  private toStringFromSelectList(value: any, config: IFilterSelectList): string {
    if (!value) {
      return value;
    }
    const res = config.selectList.values.find((v) => v.code === value);
    return res ? (res.ignoreTranslate ? res.nameKey : this.translateService.instant(res.nameKey, res.params)) : value;
  }

  private toStringFromAsyncSelectList(value: any, config: IFilterConfig): string {
    if (!value) {
      return value;
    }
    return value.name;
  }

  private toStringFromAsyncCheckList(value: any, config: IFilterConfig): string {
    if (value) {
      return value.replace(',', ', ');
    }
    return value.name;
  }

  private toStringFromCheckList(value: any, config: IFilterCheckList): string {
    if (!value) {
      return value;
    }
    let array;
    if (config.checkList.result === 'string') {
      array = value.split(',');
    } else {
      array = value;
    }

    const res = config.checkList.values
      .filter((v) => array && array.indexOf(v.code) !== -1)
      .map((v) => (v.ignoreTranslate ? v.nameKey : this.translateService.instant(v.nameKey, v.params)))
      .join(', ');
    return res ? res : value;
  }

  private toStringFromText(value: any, config: IFilterConfig): string {
    return value;
  }

  private toStringFromNumber(value: any, config: IFilterConfig): string {
    if (!value) {
      return value;
    }
    const res = [];

    if (value.min) {
      res.push(`${value.min.operator === 'gte' ? '>=' : '>'} ${value.min.value}`);
    }
    if (value.max) {
      res.push(`${value.max.operator === 'lte' ? '<=' : '<'} ${value.max.value}`);
    }

    return res.join(' & ');
  }

  private toStringFromSimpleNumber(value: any, config: IFilterConfig): string {
    if (lodash.isNumber(value?.value)) {
      return value.value.toString();
    }
    return value;
  }

  private toStringFromDate(value: any, config: IFilterDate): string {
    if (!value) {
      return value;
    }

    switch (value.mode) {
      case 'range':
        const res = [];

        if (value.min) {
          res.push(`>${lodash.get(config.date, 'includeMin', true) ? '=' : ''} ${this.dateTranslatePipe.transform(value.min.value, 'date')}`);
        }
        if (value.max) {
          res.push(`<${lodash.get(config.date, 'includeMax', false) ? '=' : ''} ${this.dateTranslatePipe.transform(value.max.value, 'date')}`);
        }

        return res.join(' & ');
      case 'rangeWithTime':
        const resTime = [];
        if (value.min) {
          const time = `${value.min.value.substring(11, 13)}:${value.min.value.substring(14, 16)}`;
          resTime.push(`>${lodash.get(config.date, 'includeMin', true) ? '=' : ''} ${this.dateTranslatePipe.transform(value.min.value, 'date')} ${time ?? ''}`);
        }
        if (value.max) {
          const time = `${value.max.value.substring(11, 13)}:${value.max.value.substring(14, 16)}`;
          resTime.push(`<${lodash.get(config.date, 'includeMax', false) ? '=' : ''} ${this.dateTranslatePipe.transform(value.max.value, 'date')} ${time ?? ''}`);
        }

        return resTime.join(' & ');
      case 'today':
        return this.translateService.instant('SEARCH_FIELD.FILTERS.DATE.MODES.TODAY');
      case 'todayBefore':
        return this.translateService.instant('SEARCH_FIELD.FILTERS.DATE.MODES.TODAY_BEFORE');
      case 'todayAfter':
        return this.translateService.instant('SEARCH_FIELD.FILTERS.DATE.MODES.TODAY_AFTER');
      case 'todayYesterday':
        return this.translateService.instant('SEARCH_FIELD.FILTERS.DATE.MODES.TODAY_YESTERDAY');
      case 'yesterday':
        return this.translateService.instant('SEARCH_FIELD.FILTERS.DATE.MODES.YESTERDAY');
      case 'yesterdayBefore':
        return this.translateService.instant('SEARCH_FIELD.FILTERS.DATE.MODES.YESTERDAY_BEFORE');
      case 'tomorrow':
        return this.translateService.instant('SEARCH_FIELD.FILTERS.DATE.MODES.TOMORROW');
      case 'tomorrowAfter':
        return this.translateService.instant('SEARCH_FIELD.FILTERS.DATE.MODES.TOMORROW_AFTER');
      case 'currentWeek':
        return this.translateService.instant('SEARCH_FIELD.FILTERS.DATE.MODES.CURRENT_WEEK');
      case 'currentMonth':
        return this.translateService.instant('SEARCH_FIELD.FILTERS.DATE.MODES.CURRENT_MONTH');
      case 'lastWeek':
        return this.translateService.instant('SEARCH_FIELD.FILTERS.DATE.MODES.LAST_WEEK');
      case 'lastMonth':
        return this.translateService.instant('SEARCH_FIELD.FILTERS.DATE.MODES.LAST_MONTH');
      case 'lastCurrentMonth':
        return this.translateService.instant('SEARCH_FIELD.FILTERS.DATE.MODES.LAST_CURRENT_MONTH');
      case 'filled':
        return this.translateService.instant('SEARCH_FIELD.FILTERS.DATE.MODES.FILLED');
      case 'empty':
        return this.translateService.instant('SEARCH_FIELD.FILTERS.DATE.MODES.EMPTY');
      default:
        return value;
    }
  }

  private toStringFromSimpleDate(value: any, config: IFilterConfig): string {
    if (!value) {
      return value;
    }
    if (value.date) {
      return this.dateTranslatePipe.transform(value.date.value, 'date');
    }
  }

  private toStringFromAutocomplete(value: any, config: IFilterConfig): string {
    if (!value) {
      return value;
    }
    return value.name;
  }

  private toStringFromMultiAutocomplete(value: any, config: IFilterConfig): string {
    if (!value || !value.length) {
      return value;
    }
    return value.length === 1 ? value[0].name : value.length + ' ' + this.translateService.instant('SEARCH_FIELD.FILTERS.MULTI_AUTOCOMPLETE.ELEMENTS');
  }

  private toStringFromCustom(value: any, config: IFilterCustom): string {
    return config.custom.toString(value, config);
  }

  private toStringFromTags(value: any, config: IFilterTags): string {
    if (!value) {
      return value;
    }
    let array;
    if (config.tags.result === 'string') {
      array = value.split(',');
    } else {
      array = value;
    }

    const res = array.join(', ');
    return res ? res : value;
  }

  private toStringFromStringList(value: any, config: IFilterStringList): string {
    if (!value) {
      return value;
    }
    let array;
    if (config.strings.result === 'string') {
      array = value.split(',');
    } else {
      array = value;
    }
    if ((array as string[]).length > 4) {
      return `${(array as string[]).length} ` + config.strings?.objectKey + 's';
    }
    const res = array.join(', ');
    return res ? res : value;
  }

  private _dispose(): void {
    if (typeof this.onLangChange !== 'undefined') {
      this.onLangChange.unsubscribe();
      this.onLangChange = undefined;
    }
  }
}
