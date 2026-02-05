import { Pipe, PipeTransform } from '@angular/core';
import { IActionConfigExt } from '../table.component';

@Pipe({
  name: 'actionparams',
  pure: true
})
export class McitActionParamsPipe<E> implements PipeTransform {
  transform(actionConfig: IActionConfigExt<E>, item: E, index: number): object {
    return actionConfig?.params != null ? actionConfig.params(item, index, actionConfig.key) : null;
  }
}
