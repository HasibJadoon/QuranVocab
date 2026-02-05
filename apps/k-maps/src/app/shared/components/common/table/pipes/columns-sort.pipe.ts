import { Pipe, PipeTransform } from '@angular/core';
import { IColumnConfigExt } from '../table.component';
import * as lodash from 'lodash';

@Pipe({
  name: 'columnssort',
  pure: true
})
export class McitColumnsSortPipe<E> implements PipeTransform {
  transform(columns: IColumnConfigExt<E>[]): IColumnConfigExt<E>[] {
    return lodash.sortBy(columns, (a) => a.position);
  }
}
