import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'sortByCount'
})
export class McitSortByCountPipe implements PipeTransform {
  transform<T>(value: T[], field: string): { key: string; count: number }[] {
    if (!value) {
      return [];
    }

    const groupedObj = value.reduce((acc, x) => {
      const key = lodash.get(x, field);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return lodash
      .sortBy(
        Object.keys(groupedObj).map((key) => ({ key, count: groupedObj[key] })),
        'count'
      )
      .reverse();
  }
}
