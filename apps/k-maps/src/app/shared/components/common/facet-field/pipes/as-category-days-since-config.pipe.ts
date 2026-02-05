import { Pipe, PipeTransform } from '@angular/core';
import { CategoryType, ICategoryConfig, ICategoryDaysSinceConfig } from '@lib-shared/common/facet-field/facet-options';

@Pipe({
  name: 'asCategoryDaysSinceConfig'
})
export class McitAsCategoryDaysSinceConfigPipe implements PipeTransform {
  transform(value: ICategoryConfig): ICategoryDaysSinceConfig {
    if (value.type === CategoryType.DAYS_SINCE) {
      return value as ICategoryDaysSinceConfig;
    }
    return null;
  }
}
