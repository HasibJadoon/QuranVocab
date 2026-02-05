import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';
import { IColumnConfigExt } from '../table.component';
import { IRowHeaderOptions } from '../table-options';

@Pipe({
  name: 'rowheaderclass',
  pure: true
})
export class McitRowHeaderClassPipe<E> implements PipeTransform {
  transform(rowHeaderOptions: IRowHeaderOptions<E>, item: E, index: number): string {
    const cs = [];

    if (rowHeaderOptions?.cssClass) {
      cs.push(lodash.isString(rowHeaderOptions.cssClass) ? rowHeaderOptions.cssClass : rowHeaderOptions.cssClass(item, index));
    }

    return lodash.compact(cs).join(' ');
  }
}
