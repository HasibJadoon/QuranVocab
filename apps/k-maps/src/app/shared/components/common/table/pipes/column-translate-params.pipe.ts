import { Pipe, PipeTransform } from '@angular/core';
import { IColumnConfigExt } from '../table.component';
import { isTranslateColumnConfig } from '../table-options';

@Pipe({
  name: 'columntranslateparams',
  pure: true
})
export class McitColumnTranslateParamsPipe<E> implements PipeTransform {
  transform(column: IColumnConfigExt<E>, item: E, index: number): object {
    return isTranslateColumnConfig(column) ? (column?.translate?.params ? column.translate.params(item, index, column.key) : null) : null;
  }
}
