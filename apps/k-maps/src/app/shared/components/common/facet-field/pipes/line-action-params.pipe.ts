import { Pipe, PipeTransform } from '@angular/core';
import { ILineActionConfig } from '../facet-options';
import { ICategoryLineModel } from '../facet-model';

@Pipe({
  name: 'lineactionparams',
  pure: true
})
export class McitLineActionParamsPipe<E> implements PipeTransform {
  transform(lineActionConfig: ILineActionConfig, item: ICategoryLineModel, key: string): object {
    return lineActionConfig?.params != null ? lineActionConfig.params(item, key) : null;
  }
}
