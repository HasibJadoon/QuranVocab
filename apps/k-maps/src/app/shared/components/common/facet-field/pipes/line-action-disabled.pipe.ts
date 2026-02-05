import { Pipe, PipeTransform } from '@angular/core';
import { ILineActionConfig } from '../facet-options';
import { ICategoryLineModel } from '../facet-model';

@Pipe({
  name: 'lineactiondisabled',
  pure: true
})
export class McitLineActionDisabledPipe implements PipeTransform {
  transform(lineActionConfig: ILineActionConfig, item: ICategoryLineModel, key: string): boolean {
    return lineActionConfig?.disabled != null ? lineActionConfig.disabled(item, key) : false;
  }
}
