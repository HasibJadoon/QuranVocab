import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { McitDateTranslatePipe } from '../../common/pipes/date-translate.pipe';
import { McitDateTimeService } from '../../services/date-time.service';
import * as lodash from 'lodash';
import { CategoryType, ICategoryBucketAutoConfig, ICategoryBucketConfig, ICategoryConfig, ICategoryDaysSinceConfig, ICategoryGeoDistanceConfig, ICategoryStandardConfig, StandardCategorySubType } from '../facet-options';

@Pipe({
  name: 'categoryValue',
  pure: false
})
export class McitCategoryValuePipe implements PipeTransform, OnDestroy {
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

  private updateValue(value: any, config: ICategoryConfig): void {
    switch (config.type) {
      case CategoryType.BUCKET:
        this.value = this.toStringFromBucket(value, config);
        break;
      case CategoryType.BUCKET_AUTO:
        this.value = this.toStringFromBucketAuto(value, config);
        break;
      case CategoryType.DAYS_SINCE:
        this.value = this.toStringFromDaysSince(value, config);
        break;
      case CategoryType.GEO_DISTANCE:
        this.value = this.toStringFromGeoDistance(value, config);
        break;
      case CategoryType.STANDARD:
        this.value = this.toStringFromStandard(value, config);
        break;
    }

    if (this.changeDectectorRef) {
      this.changeDectectorRef.markForCheck();
    }
  }

  private toStringFromBucket(value: any, config: ICategoryBucketConfig): string {
    if (!value) {
      return value;
    }
    const min = value.gte ?? value.gt;
    const max = value.lte ?? value.lt;
    return min || max ? `[${min ?? '-∞'};${max ?? '∞'}]` : '';
  }

  private toStringFromBucketAuto(value: any, config: ICategoryBucketAutoConfig): string {
    if (!value) {
      return value;
    }
    const min = value.gte ?? value.gt;
    const max = value.lte ?? value.lt;
    return min || max ? `[${min ?? '-∞'};${max ?? '∞'}]` : '';
  }

  private toStringFromDaysSince(value: any, config: ICategoryDaysSinceConfig): string {
    if (!value) {
      return value;
    }
    const min = value.gte ?? value.gt;
    const max = value.lte ?? value.lt;
    return this.dateTranslatePipe.transform(value.base, 'date') + (min || max ? ` [${min ?? '-∞'};${max ?? '∞'}]` : '');
  }

  private toStringFromGeoDistance(value: any, config: ICategoryGeoDistanceConfig): string {
    if (!value) {
      return value;
    }
    const base = value.base;
    const min = value.gte ?? value.gt;
    const max = value.lte ?? value.lt;
    return (base ? (base.name ? base.name : base.latitude + ',' + base.longitude) : this.translateService.instant('COMMON.UNKNOWN')) + (min || max ? ` [${min ?? '-∞'};${max ?? '∞'}]` : '');
  }

  private toStringFromStandard(value: any, config: ICategoryStandardConfig): string {
    if (!value) {
      return value;
    }

    switch (config.standard?.sub_type) {
      case StandardCategorySubType.ASYNC:
        return value;
      case StandardCategorySubType.LISTDICO:
        return this.translateService.instant(`${config.standard.listdico.prefixKey}.${config.standard.listdico.forceUpperCase ? value.toString().toUpperCase() : value.toString()}`);
    }

    return value;
  }

  private _dispose(): void {
    if (typeof this.onLangChange !== 'undefined') {
      this.onLangChange.unsubscribe();
      this.onLangChange = undefined;
    }
  }
}
