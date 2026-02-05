import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'filter'
})
export class McitFilterPipe<E> implements PipeTransform {
  transform(elements: E[], key: string, include: any, exclude: any): E[] {
    if (!lodash.isArray(elements)) {
      return [];
    }
    if (include !== undefined) {
      elements = elements.filter((e) => lodash.get(e, key) === include);
    }
    if (exclude !== undefined) {
      elements = elements.filter((e) => lodash.get(e, key) !== exclude);
    }
    return elements;
  }
}
