import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'map'
})
export class McitMapPipe implements PipeTransform {
  transform(input: any[], value: any): any[] {
    if (!lodash.isArray(input)) {
      return [];
    }
    return input.map((e) => e[value]);
  }
}
