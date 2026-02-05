import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';
import { IColumnConfigExt } from '../table.component';

const BREAKPOINTS = ['xs', 'sm', 'md', 'lg', 'xl'];

@Pipe({
  name: 'columnheaderclass',
  pure: false
})
export class McitColumnHeaderClassPipe<E> implements PipeTransform {
  transform(column: IColumnConfigExt<E>, isXl: boolean, mode: string): string {
    const cs = [];

    if (isXl && mode !== 'visible' && !column.visible) {
      cs.push('d-none');
    } else {
      if (column?.minBreakpoint && column?.minBreakpoint !== 'xs') {
        cs.push('d-none');
        cs.push(`d-${column.minBreakpoint}-table-cell`);
      }
      if (column?.maxBreakpoint && column?.maxBreakpoint !== 'xl') {
        const i = BREAKPOINTS.indexOf(column.maxBreakpoint);
        cs.push(`d-${BREAKPOINTS[i + 1]}-none`);
      }
    }

    return lodash.compact(cs).join(' ');
  }
}
