import { Pipe, PipeTransform } from '@angular/core';
import { IColumnConfigExt } from '../table.component';

@Pipe({
  name: 'columnsindex',
  pure: false
})
export class McitColumnsIndexPipe<E> implements PipeTransform {
  transform(columns: IColumnConfigExt<E>[], current: number, opts: { isXl: boolean; selectable: boolean; showLineNumber: boolean }): { index: number; col: number } {
    if (!columns[current].visible) {
      return { index: -1, col: -1 };
    }
    let j = 0;
    for (let i = 0; i < current; i++) {
      if (columns[i].visible) {
        j++;
      }
    }
    const col = j;
    if (opts?.isXl) {
      if (opts?.showLineNumber) {
        j++;
      }
      if (opts?.selectable) {
        j++;
      }
    }
    return { index: j, col };
  }
}
