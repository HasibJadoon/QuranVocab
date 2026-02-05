import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'compact'
})
export class McitCompactPipe implements PipeTransform {
  transform(input: any, character: string = ''): any {
    if (!lodash.isArray(input)) {
      return input;
    }

    return lodash.compact(<[]>input);
  }
}
