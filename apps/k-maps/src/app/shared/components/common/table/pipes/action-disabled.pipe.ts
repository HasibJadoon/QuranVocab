import { Pipe, PipeTransform } from '@angular/core';
import { IActionConfigExt } from '../table.component';
import { isObservable, Observable, of } from 'rxjs';

@Pipe({
  name: 'actiondisabled',
  pure: true
})
export class McitActionDisabledPipe<E> implements PipeTransform {
  transform(actionConfig: IActionConfigExt<E>, item: E, index: number): Observable<boolean> {
    const result = actionConfig?.disabled?.(item, index, actionConfig.key) ?? false;
    return isObservable(result) ? result : of(result);
  }
}
