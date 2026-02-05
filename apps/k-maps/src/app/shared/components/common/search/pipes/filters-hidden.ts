import { Pipe, PipeTransform } from '@angular/core';
import { FilterAvailability, FilterVisibility, IFiltersConfig } from '../search-options';
import * as lodash from 'lodash';
import { IFiltersSettingsModel } from '../search-model';

@Pipe({
  name: 'filtershidden',
  pure: true
})
export class McitFiltersHiddenPipe implements PipeTransform {
  transform(value: any, config: IFiltersSettingsModel, filtersConfig: IFiltersConfig, searchBox: string): boolean {
    const res = Object.keys(config ?? {})
      .filter((k) => config[k].visibility === FilterVisibility.HIDDEN || (searchBox && filtersConfig[k]?.availability === FilterAvailability.ONLY_FILTERS))
      .find((k) => !value || lodash.isNil(value[k]));
    return !lodash.isNil(res);
  }
}
