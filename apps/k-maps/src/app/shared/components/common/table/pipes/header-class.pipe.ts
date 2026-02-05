import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';
import { IHeaderOptions, IRowOptions } from '../table-options';

@Pipe({
  name: 'headerclass',
  pure: true
})
export class McitHeaderClassPipe<E> implements PipeTransform {
  transform(headerOptions: IHeaderOptions): string {
    const cs = [];

    if (headerOptions?.cssClass) {
      cs.push(headerOptions.cssClass);
    }

    return lodash.compact(cs).join(' ');
  }
}
