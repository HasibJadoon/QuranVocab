import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';
import { ILineActionConfig } from '../facet-options';
import { ICategoryLineModel } from '../facet-model';

@Pipe({
  name: 'lineactionstringorfn',
  pure: false
})
export class McitLineActionStringOrFnPipe<E> implements PipeTransform {
  transform(lineActionConfig: ILineActionConfig, key: string, item: ICategoryLineModel, categoryKey: string): any {
    const v = lodash.get(lineActionConfig, key);
    if (!v) {
      return null;
    }
    return lodash.isString(v) ? v : v(item, categoryKey);
  }
}
