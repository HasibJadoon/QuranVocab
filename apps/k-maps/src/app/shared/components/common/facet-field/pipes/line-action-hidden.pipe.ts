import { Pipe, PipeTransform } from '@angular/core';
import { ILineActionConfig } from '../facet-options';
import { ICategoryLineModel } from '../facet-model';

@Pipe({
  name: 'lineactionhidden',
  pure: true
})
export class McitLineActionHiddenPipe<E> implements PipeTransform {
  transform(lineActionConfig: ILineActionConfig, item: ICategoryLineModel, key: string): boolean {
    return lineActionConfig?.hidden != null ? lineActionConfig.hidden(item, key) : false;
  }
}
