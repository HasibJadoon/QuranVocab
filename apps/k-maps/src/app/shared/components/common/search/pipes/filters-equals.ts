import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'filtersequals',
  pure: true
})
export class McitFiltersEqualsPipe implements PipeTransform {
  transform(value: any, ...args: any[]): any {
    const old = args[0];
    if (!value && !old) {
      return true;
    }
    if ((!value && old) || (value && !old)) {
      return false;
    }

    return lodash.isEqual(value, old);
  }
}
