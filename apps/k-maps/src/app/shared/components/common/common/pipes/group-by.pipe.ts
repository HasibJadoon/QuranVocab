import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({ name: 'groupBy' })
export class McitGroupByPipe implements PipeTransform {
  transform<T>(value: Array<T>, field: string): { key: any; value: T[] }[] {
    if (!value) {
      return [];
    }
    const groupedObj = value.reduce((acc, x) => {
      const key = lodash.get(x, field);
      (acc[key] = acc[key] || []).push(x);
      return acc;
    }, {});
    return Object.keys(groupedObj).map((key) => ({ key, value: groupedObj[key] }));
  }
}
