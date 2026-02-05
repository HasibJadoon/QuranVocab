import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'sum'
})
export class McitSumPipe implements PipeTransform {
  transform(input: number[]): number {
    if (!lodash.isArray(input)) {
      return null;
    }
    return lodash.sum(input);
  }
}
