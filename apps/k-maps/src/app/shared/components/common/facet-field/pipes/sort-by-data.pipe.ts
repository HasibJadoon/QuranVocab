import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';
import { ICategoriesModel } from '../facet-model';

@Pipe({
  name: 'sortByData'
})
export class McitSortByDataPipe implements PipeTransform {
  transform(value: string[], data: ICategoriesModel): string[] {
    if (value == null || data == null) {
      return value;
    }
    return lodash.sortBy(value, (v) => !(data[v] != null));
  }
}
