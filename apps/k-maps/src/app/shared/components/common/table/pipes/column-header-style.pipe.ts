import { Pipe, PipeTransform } from '@angular/core';
import { IColumnConfigExt } from '../table.component';

@Pipe({
  name: 'columnheaderstyle',
  pure: true
})
export class McitColumnHeaderStylePipe<E> implements PipeTransform {
  transform(column: IColumnConfigExt<E>, resize: boolean): { [key: string]: any } {
    const cs = {};

    if (resize && column?.resizeWidth != null) {
      cs['width'] = `${column.resizeWidth}px`;
    } else {
      if (column?.minWidth != null) {
        cs['min-width'] = column.minWidth;
      }
      if (column?.width != null) {
        cs['width'] = column.width;
      }
      if (column?.maxWidth != null) {
        cs['max-width'] = column.maxWidth;
      }
    }

    return cs;
  }
}
