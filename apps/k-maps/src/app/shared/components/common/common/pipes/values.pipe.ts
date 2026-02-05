import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'values'
})
export class McitValuesPipe implements PipeTransform {
  transform(value: any): string[] {
    if (!value || !(value instanceof Object)) {
      return value;
    }
    return lodash.values(value);
  }
}
