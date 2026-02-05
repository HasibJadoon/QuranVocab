import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'textTruncate'
})
export class McitTextTruncatePipe implements PipeTransform {
  transform(input: string, maxLength: number, character: string = '…'): any {
    if (!lodash.isString(input) || input.length <= maxLength) {
      return input;
    }
    return lodash.trim(input.slice(0, maxLength - 1)) + character;
  }
}
