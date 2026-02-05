import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';
import { FilterAvailability, IFiltersConfig } from '../search-options';

@Pipe({
  name: 'filtersonly',
  pure: true
})
export class McitFiltersOnlyPipe implements PipeTransform {
  transform(value: any, filtersConfig: IFiltersConfig): boolean {
    if (!value || !filtersConfig) {
      return false;
    }
    const keys = Object.keys(filtersConfig);
    if (keys.length === 0) {
      return false;
    }
    const res = keys.find((k) => filtersConfig[k].availability === FilterAvailability.ONLY_FILTERS && !lodash.isNil(value[k]));
    return !!res;
  }
}
