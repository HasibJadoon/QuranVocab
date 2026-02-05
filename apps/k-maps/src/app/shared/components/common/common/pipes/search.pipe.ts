import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'mcitSearch'
})
export class McitSearchPipe implements PipeTransform {
  transform<E>(input: E[], key: string, search: any): E[] {
    if (input == null) {
      return null;
    }
    if (!search) {
      return input;
    }
    const regex = new RegExp(lodash.escapeRegExp(search), 'i');
    return input.filter((i) => regex.test(lodash.get(i, key)));
  }
}
