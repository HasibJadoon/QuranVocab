import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'join'
})
export class McitJoinPipe implements PipeTransform {
  transform(input: string | string[], character: string = ''): any {
    if (!lodash.isArray(input)) {
      return input;
    }
    const filtered = (<string[]>input).filter(Boolean);
    return filtered.join(filtered.some((item) => item.length > 20) ? character + '\r' : character);
  }
}
