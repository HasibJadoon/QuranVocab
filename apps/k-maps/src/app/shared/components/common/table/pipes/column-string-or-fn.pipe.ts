import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';
import { IColumnConfigExt } from '../table.component';

@Pipe({
  name: 'columnstringorfn',
  pure: false
})
export class McitColumnStringOrFnPipe<E> implements PipeTransform {
  transform(column: IColumnConfigExt<E>, key: string, item: E, index: number): any {
    const v = lodash.get(column, key);
    if (!v) {
      return null;
    }
    return lodash.isString(v) ? v : v(item, index, column.key);
  }
}
