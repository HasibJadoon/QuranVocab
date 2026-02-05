import { Pipe, PipeTransform } from '@angular/core';
import { IActionConfigExt } from '../table.component';
import { IRowSelectOptions } from '../table-options';

@Pipe({
  name: 'selectall',
  pure: false
})
export class McitSelectAlldPipe<E> implements PipeTransform {
  transform(selecteds: boolean[], items: E[], rowSelectOptions: IRowSelectOptions<E>): 'NONE' | 'PARTIAL' | 'ALL' {
    if (!selecteds || !items || selecteds.length === 0 || items.length === 0) {
      return 'NONE';
    }

    const disableds = items.map((item, index) => (rowSelectOptions?.disabled ? rowSelectOptions?.disabled(item, index) : false));
    const ns = disableds.filter((b) => !b).length;
    const n = selecteds.filter((s) => s).length;

    if (n === ns) {
      return 'ALL';
    }
    return n === 0 ? 'NONE' : 'PARTIAL';
  }
}
