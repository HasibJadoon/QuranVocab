import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'head',
  pure: false
})
export class McitHeadPipe<E> implements PipeTransform {
  transform(array: E[]): E {
    if (!lodash.isArray(array)) {
      return null;
    }

    return lodash.head(array);
  }
}
