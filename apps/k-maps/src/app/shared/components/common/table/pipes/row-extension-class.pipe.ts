import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';
import { IRowExtensionOptions } from '../table-options';

@Pipe({
  name: 'rowextensionclass',
  pure: true
})
export class McitRowExtensionClassPipe<E> implements PipeTransform {
  transform(rowExtensionOptions: IRowExtensionOptions<E>, item: E, index: number): string {
    const cs = [];

    if (rowExtensionOptions?.cssClass) {
      cs.push(lodash.isString(rowExtensionOptions.cssClass) ? rowExtensionOptions.cssClass : rowExtensionOptions.cssClass(item, index));
    }

    return lodash.compact(cs).join(' ');
  }
}
