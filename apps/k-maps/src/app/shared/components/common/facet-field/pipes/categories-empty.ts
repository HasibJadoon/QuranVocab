import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';
import { ICategoriesModel } from '../facet-model';

@Pipe({
  name: 'categoriesempty',
  pure: true
})
export class McitCategoriesEmptyPipe implements PipeTransform {
  transform(value: ICategoriesModel): boolean {
    if (!value) {
      return true;
    }
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return true;
    }
    return keys.find((k) => !lodash.isEmpty(value[k])) == null;
  }
}
