import { Pipe, PipeTransform } from '@angular/core';
import { IColumnConfigExt } from '../table.component';

@Pipe({
  name: 'columnsvisible',
  pure: true
})
export class McitColumnsVisiblePipe<E> implements PipeTransform {
  transform(columns: IColumnConfigExt<E>[], visible: boolean): IColumnConfigExt<E>[] {
    if (columns == null || visible) {
      return columns;
    }
    return columns.filter((c) => c.visible);
  }
}
