import { Pipe, PipeTransform } from '@angular/core';
import { get } from 'lodash';

@Pipe({ name: 'lodashGet' })
export class McitLodashGetPipe implements PipeTransform {
  transform(value: any, ...args: any[]): any {
    if (value && args[0]) {
      return get(value, args[0]);
    }
    return value;
  }
}
