import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';
import { IActionConfigExt } from '../table.component';

@Pipe({
  name: 'actionstringorfn',
  pure: false
})
export class McitActionStringOrFnPipe<E> implements PipeTransform {
  transform(action: IActionConfigExt<E>, key: string, item: E, index: number): any {
    const v = lodash.get(action, key);
    if (!v) {
      return null;
    }
    return lodash.isString(v) ? v : v(item, index, action.key);
  }
}
