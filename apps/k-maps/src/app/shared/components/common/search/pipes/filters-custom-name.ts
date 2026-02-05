import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';
import { FilterAvailability, IFiltersConfig } from '../search-options';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'filterscustomname',
  pure: true
})
export class McitFiltersCustomNamePipe implements PipeTransform {
  constructor(private translateService: TranslateService) {}
  transform(value: any, name: string): string {
    if (!value || !name) {
      return null;
    }
    let jsonValue;
    try {
      jsonValue = JSON.parse(value);
    } catch (e) {
      return value;
    }
    if (jsonValue.checkboxChecked && !jsonValue.text) {
      return this.translateService.instant(name);
    } else if (jsonValue.checkboxChecked && jsonValue.text) {
      return [this.translateService.instant(name), ' & ', this.translateService.instant('RECEIPT_MANAGEMENT.COMMENT'), ': ', jsonValue.text].join('');
    } else {
      return value;
    }
  }
}
