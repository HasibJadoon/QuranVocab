import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'split'
})
export class McitSplitPipe implements PipeTransform {
  transform(input: any, character: string = ','): any {
    if (!lodash.isString(input)) {
      return input;
    }

    return input ? input.split(character) : input;
  }
}
