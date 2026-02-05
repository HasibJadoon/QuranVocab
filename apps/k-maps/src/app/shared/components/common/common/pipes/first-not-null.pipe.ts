import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'firstnotnull'
})
export class McitFirstNotNullPipe implements PipeTransform {
  transform(input: any, character: string = ''): any {
    if (!lodash.isArray(input)) {
      return input;
    }

    return (<[]>input).find((i) => i != null && i !== '');
  }
}
