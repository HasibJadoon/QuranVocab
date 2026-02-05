import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';
import { IRowOptions } from '../table-options';

@Pipe({
  name: 'rowclass',
  pure: true
})
export class McitRowClassPipe<E> implements PipeTransform {
  transform(rowOptions: IRowOptions<E>, item: E, index: number): string {
    const cs = [];

    if (rowOptions?.cssClass) {
      cs.push(lodash.isString(rowOptions.cssClass) ? rowOptions.cssClass : rowOptions.cssClass(item, index));
    }

    return lodash.compact(cs).join(' ');
  }
}
