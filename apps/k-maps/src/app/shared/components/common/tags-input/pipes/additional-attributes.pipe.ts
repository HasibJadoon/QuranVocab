import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'additionalAttr',
  pure: false
})
export class McitDisplayAdditionalAttributsPipe<E> implements PipeTransform {
  transform(additionalAttr: Array<string>, item: E): any {
    const values = additionalAttr.map((key) => lodash.get(item, key)).filter((value) => value);

    return values.length ? '(' + values.join(' - ') + ')' : undefined;
  }
}
