import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'servicetype'
})
export class McitServiceTypePipe implements PipeTransform {
  transform(input: any, character: string = ''): any {
    if (input === 'VIN') {
      return 'VIN';
    } else if (input === 'TRIP') {
      return 'TRIP';
    }

    return input;
  }
}
