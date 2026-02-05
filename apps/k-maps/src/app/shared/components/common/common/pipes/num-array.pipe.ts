import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numarray'
})
export class McitNumArrayPipe implements PipeTransform {
  transform(value: any, ...args: any[]): any {
    return new Array(value);
  }
}
