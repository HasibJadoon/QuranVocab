import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'ismatch'
})
export class McitIsMatchPipe implements PipeTransform {
  transform(value: string, search: string): boolean {
    if (!value) {
      return false;
    }
    if (!search) {
      return true;
    }
    return new RegExp(lodash.escapeRegExp(search), 'i').test(value);
  }
}
