import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';
import { IColumnConfigExt } from '../table.component';

const BREAKPOINTS = ['xs', 'sm', 'md', 'lg', 'xl'];

@Pipe({
  name: 'columnclass',
  pure: false
})
export class McitColumnClassPipe<E> implements PipeTransform {
  transform(column: IColumnConfigExt<E>, item: E, index: number, isXl: boolean, mode: string): string {
    const cs = [];

    switch (column?.verticalAlign) {
      case 'start':
        cs.push('align-start');
        break;
      case 'end':
        cs.push('align-end');
        break;
      case 'middle':
      default:
        cs.push('align-middle');
        break;
    }

    switch (column?.horizontalAlign) {
      case 'start':
        cs.push('text-left');
        break;
      case 'end':
        cs.push('text-right');
        break;
      case 'middle':
        cs.push('text-center');
        break;
    }

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

    if (column?.cssClass) {
      cs.push(lodash.isString(column.cssClass) ? column.cssClass : column.cssClass(item, index, column.key));
    }

    return lodash.compact(cs).join(' ');
  }
}
