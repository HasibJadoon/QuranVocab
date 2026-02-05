import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'joinForTranslate'
})
export class McitJoinForTranslatePipe implements PipeTransform {
  transform(input: any, character: string = '_'): any {
    if (!lodash.isString(input)) {
      return input;
    }
    return input.split(' ').join(character).toUpperCase();
  }
}
