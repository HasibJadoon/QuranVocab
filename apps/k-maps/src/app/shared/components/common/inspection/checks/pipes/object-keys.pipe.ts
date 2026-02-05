import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'objectKeys'
})
export class McitObjectKeysPipe implements PipeTransform {
  transform(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }
}
