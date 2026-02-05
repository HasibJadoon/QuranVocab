import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'concat'
})
export class McitConcatPipe implements PipeTransform {
  transform(input: any[], ...args: any[]): any[] {
    if (!lodash.isArray(input)) {
      return [];
    }
    return input.concat(...args).filter((e) => !!e);
  }
}
