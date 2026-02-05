import { Pipe, PipeTransform } from '@angular/core';
import { CategoryType, ICategoryConfig, ICategoryGeoDistanceConfig } from '@lib-shared/common/facet-field/facet-options';

@Pipe({
  name: 'asCategoryGeoDistanceConfig'
})
export class McitAsCategoryGeoDistanceConfigPipe implements PipeTransform {
  transform(value: ICategoryConfig): ICategoryGeoDistanceConfig {
    if (value.type === CategoryType.GEO_DISTANCE) {
      return value as ICategoryGeoDistanceConfig;
    }
    return null;
  }
}
