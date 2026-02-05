import { Pipe, PipeTransform } from '@angular/core';
import { IRowHeaderOptions } from '../table-options';

@Pipe({
  name: 'rowheaderstyle',
  pure: true
})
export class McitRowHeaderStylePipe<E> implements PipeTransform {
  transform(rowHeaderOptions: IRowHeaderOptions<E>): { [key: string]: any } {
    const cs = {};

    if (rowHeaderOptions?.minWidth != null) {
      cs['min-width'] = rowHeaderOptions.minWidth;
    }
    if (rowHeaderOptions?.width != null) {
      cs['width'] = rowHeaderOptions.width;
    }
    if (rowHeaderOptions?.maxWidth != null) {
      cs['max-width'] = rowHeaderOptions.maxWidth;
    }

    return cs;
  }
}
