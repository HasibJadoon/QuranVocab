import { Pipe, PipeTransform } from '@angular/core';
import { IColumnAction } from '../table-options';

@Pipe({
  name: 'actioncolumnheaderstyle',
  pure: true
})
export class McitActionColumnHeaderStylePipe<E> implements PipeTransform {
  transform(columnAction: IColumnAction): { [key: string]: any } {
    const cs = {};

    if (columnAction?.minWidth != null) {
      cs['min-width'] = columnAction.minWidth;
    }
    if (columnAction?.width != null) {
      cs['width'] = columnAction.width;
    }
    if (columnAction?.maxWidth != null) {
      cs['max-width'] = columnAction.maxWidth;
    }

    return cs;
  }
}
