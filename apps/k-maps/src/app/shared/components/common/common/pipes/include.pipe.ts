import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'include'
})
export class McitIncludePipe implements PipeTransform {
  transform(input: any[], value: any): boolean {
    if (!lodash.isArray(input)) {
      return false;
    }
    return input.indexOf(value) !== -1;
  }
}
