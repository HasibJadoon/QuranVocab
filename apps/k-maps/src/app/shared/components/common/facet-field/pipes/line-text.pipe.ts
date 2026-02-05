import { Pipe, PipeTransform } from '@angular/core';
import { ICategoryStandardConfig } from '../facet-options';
import { ICategoryLineModel } from '../facet-model';

@Pipe({
  name: 'lineText'
})
export class McitLineTextPipe implements PipeTransform {
  transform(value: ICategoryLineModel, key: string, config: ICategoryStandardConfig): string {
    if (key == null || config == null) {
      return null;
    }
    return config.standard?.text?.transform ? config.standard.text.transform(value, key) : value._id;
  }
}
