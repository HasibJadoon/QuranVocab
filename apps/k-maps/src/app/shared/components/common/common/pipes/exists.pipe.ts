import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'exists'
})
export class McitExistsPipe<E> implements PipeTransform {
  transform(input: E[], key: string): E[] {
    if (!lodash.isArray(input)) {
      return [];
    }
    return input.filter((e) => !!lodash.get(e, key));
  }
}
