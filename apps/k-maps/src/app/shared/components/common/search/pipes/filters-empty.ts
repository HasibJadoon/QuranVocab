import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'filtersempty',
  pure: true
})
export class McitFiltersEmptyPipe implements PipeTransform {
  transform(value: any): boolean {
    if (!value) {
      return true;
    }
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return true;
    }
    const res = keys.find((k) => !lodash.isNil(value[k]));
    return !res;
  }
}
