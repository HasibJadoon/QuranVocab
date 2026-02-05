import { Pipe, PipeTransform } from '@angular/core';
import { FacetModel } from '@lib-shared/common/facet-field/facet-model';
import { ICategoryConfig } from '@lib-shared/common/facet-field/facet-options';
import * as lodash from 'lodash';

@Pipe({
  name: 'isSelectedFacetValue'
})
export class McitIsSelectedFacetValuePipe implements PipeTransform {
  transform(value: FacetModel, select: FacetModel[], config: ICategoryConfig): boolean {
    const equal = config.isSelected != null ? config.isSelected : lodash.isEqual;
    return select?.some((v) => equal(v, value)) ?? false;
  }
}
