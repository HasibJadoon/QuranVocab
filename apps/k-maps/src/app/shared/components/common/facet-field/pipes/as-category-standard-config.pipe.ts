import { Pipe, PipeTransform } from '@angular/core';
import { CategoryType, ICategoryConfig, ICategoryStandardConfig } from '@lib-shared/common/facet-field/facet-options';

@Pipe({
  name: 'asCategoryStandardConfig'
})
export class McitAsCategoryStandardConfigPipe implements PipeTransform {
  transform(value: ICategoryConfig): ICategoryStandardConfig {
    if (value.type === CategoryType.STANDARD) {
      return value as ICategoryStandardConfig;
    }
    return null;
  }
}
