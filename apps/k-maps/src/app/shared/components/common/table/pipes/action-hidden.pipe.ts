import { Pipe, PipeTransform } from '@angular/core';
import { IActionConfigExt } from '../table.component';
import { isObservable, Observable, of } from 'rxjs';

@Pipe({
  name: 'actionhidden',
  pure: true
})
export class McitActionHiddenPipe<E> implements PipeTransform {
  transform(actionConfig: IActionConfigExt<E>, item: E, index: number): Observable<boolean> {
    const result = actionConfig?.hidden?.(item, index, actionConfig.key) ?? false;
    return isObservable(result) ? result : of(result);
  }
}
