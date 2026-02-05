import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'totalPage'
})
export class McitTotalPagePipe implements PipeTransform {
  transform(total: number, perPage: number): number {
    if (!total) {
      return 0;
    }
    return Math.floor(total / perPage + (total % perPage === 0 ? 0 : 1));
  }
}
