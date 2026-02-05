import { Pipe, PipeTransform } from '@angular/core';
import { CategoryType, ICategoryBucketAutoConfig, ICategoryConfig } from '@lib-shared/common/facet-field/facet-options';

@Pipe({
  name: 'asCategoryBucketAutoConfig'
})
export class McitAsCategoryBucketAutoConfigPipe implements PipeTransform {
  transform(value: ICategoryConfig): ICategoryBucketAutoConfig {
    if (value.type === CategoryType.BUCKET_AUTO) {
      return value as ICategoryBucketAutoConfig;
    }
    return null;
  }
}
