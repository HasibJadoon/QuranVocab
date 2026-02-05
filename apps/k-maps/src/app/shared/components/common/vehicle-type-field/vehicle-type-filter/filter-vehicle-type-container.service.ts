import { Injectable } from '@angular/core';
import * as lodash from 'lodash';
import { IVehicleTypeFilterModel, McitFilterVehicleTypeContainerComponent } from './filter-vehicle-type-container.component';
import { FilterType, FilterVisibility, IFilterConfig } from '../../search/search-options';

@Injectable()
export class McitFilterVehicleTypeContainerService {
  constructor() {}

  buildVehicleTypeFilter(
    nameKey: string,
    data: any = {},
    options: { visibility: FilterVisibility; defaultValue: any } = {
      visibility: FilterVisibility.VISIBLE,
      defaultValue: null
    }
  ): IFilterConfig {
    return {
      type: FilterType.CUSTOM,
      nameKey,
      custom: {
        toString: (value: IVehicleTypeFilterModel, config: IFilterConfig) => lodash.compact([lodash.get(value.maker, 'name'), lodash.get(value.model, 'name')]).join(' / '),
        componentType: McitFilterVehicleTypeContainerComponent,
        data,
        query: {
          toString: (value: IVehicleTypeFilterModel) => JSON.stringify(value),
          fromString: (value: string) => JSON.parse(value)
        }
      },
      visibility: options.visibility,
      defaultValue: options.defaultValue
    };
  }

  toVehicleTypeFilter(filters: any, fromKey: string, toKeys: { maker: string; model: string }): { [key: string]: string } {
    if (!filters) {
      return {};
    }
    const f = filters[fromKey];
    if (!f) {
      return {};
    }

    return {
      [toKeys.maker]: lodash.get(f, 'maker.name'),
      [toKeys.model]: lodash.get(f, 'model.name')
    };
  }
}
