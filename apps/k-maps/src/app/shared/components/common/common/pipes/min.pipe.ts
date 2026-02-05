import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'min'
})
export class McitMinPipe implements PipeTransform {
  transform(value: number[]): number {
    if (!value) {
      return null;
    }
    return Math.min(...value);
  }
}
