import { Pipe, PipeTransform } from '@angular/core';
import { IColumnConfigExt } from '../table.component';

@Pipe({
  name: 'columnstyle',
  pure: true
})
export class McitColumnStylePipe<E> implements PipeTransform {
  transform(column: IColumnConfigExt<E>, item: E, index: number): { [key: string]: any } {
    return {};
  }
}
