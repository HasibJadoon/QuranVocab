import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'last',
  pure: false
})
export class McitLastPipe<E> implements PipeTransform {
  transform(array: E[]): E {
    if (!lodash.isArray(array)) {
      return null;
    }

    return lodash.last(array);
  }
}
