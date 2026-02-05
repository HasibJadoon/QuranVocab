import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'sortBySettings'
})
export class McitSortBySettingsPipe implements PipeTransform {
  transform(value: string[], positions: string[]): string[] {
    if (value == null || positions == null) {
      return value;
    }
    return lodash.sortBy(value, (v) => {
      const pos = positions.indexOf(v);
      if (pos === -1) {
        return Number.MAX_SAFE_INTEGER;
      }
      return pos;
    });
  }
}
