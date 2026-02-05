import { Injectable } from '@angular/core';
import { FilterType, FilterVisibility, IFilterConfig } from '../../search-options';
import { IColorFilterModel, McitFilterColorContainerComponent } from './filter-color-container.component';

@Injectable()
export class McitFilterColorContainerService {
  constructor() {}

  buildColorFilter(nameKey: string, data: { colors: string[] }): IFilterConfig {
    return {
      type: FilterType.CUSTOM,
      nameKey,
      custom: {
        componentType: McitFilterColorContainerComponent,
        data,
        query: {
          toString: (value: IColorFilterModel) => JSON.stringify(value),
          fromString: (value: string) => JSON.parse(value)
        }
      }
    };
  }
}
