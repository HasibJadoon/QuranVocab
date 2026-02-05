import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'floor'
})
export class McitFloorPipe implements PipeTransform {
  transform(value: number): number {
    return Math.floor(value);
  }
}
