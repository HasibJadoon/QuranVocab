import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';
import { ICategoriesModel } from '../facet-model';

@Pipe({
  name: 'categoriescountnotempty',
  pure: true
})
export class McitCategoriesCountNotEmptyPipe implements PipeTransform {
  transform(value: ICategoriesModel): number {
    if (!value) {
      return 0;
    }
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return 0;
    }
    return keys.filter((k) => !lodash.isEmpty(value[k])).length;
  }
}
