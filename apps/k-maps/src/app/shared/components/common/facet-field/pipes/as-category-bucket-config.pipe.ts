import { Pipe, PipeTransform } from '@angular/core';
import { CategoryType, ICategoryBucketConfig, ICategoryConfig } from '@lib-shared/common/facet-field/facet-options';

@Pipe({
  name: 'asCategoryBucketConfig'
})
export class McitAsCategoryBucketConfigPipe implements PipeTransform {
  transform(value: ICategoryConfig): ICategoryBucketConfig {
    if (value.type === CategoryType.BUCKET) {
      return value as ICategoryBucketConfig;
    }
    return null;
  }
}
