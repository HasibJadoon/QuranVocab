import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'max'
})
export class McitMaxPipe implements PipeTransform {
  transform(value: number[]): number {
    if (!value) {
      return null;
    }
    return Math.max(...value);
  }
}
