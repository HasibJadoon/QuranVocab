import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'find',
  pure: false
})
export class McitFindPipe<E> implements PipeTransform {
  transform(input: any, array: E[], key?: string): E {
    if (!lodash.isArray(array)) {
      return null;
    }

    return array.find((a) => (key != null ? lodash.get(a, key) : a) === input);
  }
}
