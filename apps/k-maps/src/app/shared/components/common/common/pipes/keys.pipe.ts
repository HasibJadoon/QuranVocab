import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'keys'
})
export class McitKeysPipe implements PipeTransform {
  transform(value: any): string[] {
    if (!value || !(value instanceof Object)) {
      return value;
    }
    return Object.keys(value);
  }
}
