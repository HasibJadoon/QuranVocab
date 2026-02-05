import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'roundPricePipe'
})
export class McitRoundPricePipe implements PipeTransform {
  transform(value: number): number {
    if (value) {
      return Math.round(value);
    } else {
      return 0;
    }
  }
}
