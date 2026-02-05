import { Pipe, PipeTransform } from '@angular/core';
import { isArray, values, isNil, isObject } from 'lodash';

@Pipe({
  name: 'isobjectdefined'
})
export class McitIsObjectDefinedPipe implements PipeTransform {
  transform(input: any): any {
    return input ? values(input).reduce((acc, item) => acc || (isObject(item) ? this.transform(item) : !isNil(item)), false) : false;
  }
}
