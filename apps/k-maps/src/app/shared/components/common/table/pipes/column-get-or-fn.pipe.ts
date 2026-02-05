import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';
import { IColumnConfigExt } from '../table.component';
import { isObservable, Observable, of } from 'rxjs';

@Pipe({
  name: 'columngetorfn',
  pure: false
})
export class McitColumnGetOrFnPipe<E> implements PipeTransform {
  transform(column: IColumnConfigExt<E>, key: string, item: E, index: number): Observable<any> {
    const v = lodash.get(column, key);
    if (!v) {
      return of(null);
    }

    if (lodash.isString(v)) {
      return of(lodash.get(item, v));
    }

    const result = v(item, index, column.key);

    if (isObservable(result)) {
      return result;
    }
    return of(result);
  }
}
