import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'sortBy'
})
export class McitSortByPipe implements PipeTransform {
  transform<T>(value: T[], field: string, reverse = false): T[] {
    if (!value || !field) {
      return value;
    }

    const result = lodash.sortBy(value, field);
    return reverse ? result.reverse() : result;
  }
}
