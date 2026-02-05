import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'unique'
})
export class McitUniquePipe implements PipeTransform {
  transform<T>(value: T[], field: string): T[] {
    if (!value || !field) {
      return value;
    }
    return lodash.uniqBy(value, field);
  }
}
