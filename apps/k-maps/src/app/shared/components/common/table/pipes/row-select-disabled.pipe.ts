import { Pipe, PipeTransform } from '@angular/core';
import { IActionConfigExt } from '../table.component';
import { IRowSelectOptions } from '../table-options';

@Pipe({
  name: 'rowselectdisabled',
  pure: false
})
export class McitRowSelectDisabledPipe<E> implements PipeTransform {
  transform(rowSelectOptions: IRowSelectOptions<E>, item: E, index: number): boolean {
    return rowSelectOptions?.disabled != null ? rowSelectOptions.disabled(item, index) : false;
  }
}
