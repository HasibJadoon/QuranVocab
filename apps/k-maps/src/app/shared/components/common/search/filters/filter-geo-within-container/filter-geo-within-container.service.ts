import { Injectable } from '@angular/core';
import { FilterAvailability, FilterType, FilterVisibility, IFilterConfig } from '../../search-options';
import { IGeoWithinFilterModel, McitFilterGeoWithinContainerComponent } from '@lib-shared/common/search/filters/filter-geo-within-container/filter-geo-within-container.component';
import { McitDistanceService } from '@lib-shared/common/services/distance.service';
import * as lodash from 'lodash';

@Injectable()
export class McitFilterGeoWithinContainerService {
  constructor(private distanceService: McitDistanceService) {}

  buildGeoWithinFilter(
    nameKey: string,
    data: {},
    options: { visibility: FilterVisibility; defaultValue: any; availability?: FilterAvailability } = {
      visibility: FilterVisibility.VISIBLE,
      defaultValue: null
    }
  ): IFilterConfig {
    return {
      type: FilterType.CUSTOM,
      nameKey,
      custom: {
        toString: (value: IGeoWithinFilterModel, config: IFilterConfig) => {
          let finalString = '';
          if (value.base?.name) {
            finalString += lodash.truncate(value.base.name, {
              length: 15,
              omission: '…'
            });
          }
          if (value.radius != null) {
            finalString += ` (${value.radius} ${this.distanceService.currentDistanceFormat.toLowerCase()})`;
          }
          return finalString;
        },
        componentType: McitFilterGeoWithinContainerComponent,
        data: {},
        query: {
          toString: (value: IGeoWithinFilterModel) => JSON.stringify(value),
          fromString: (value: string) => JSON.parse(value)
        }
      },
      visibility: options.visibility,
      defaultValue: options.defaultValue,
      availability: options.availability
    };
  }

  toGeoWithinFilter(
    filters: any,
    fromKey: string,
    toKeys: {
      longitude: string;
      latitude: string;
      radius: string;
    }
  ): { [key: string]: string } {
    if (!filters) {
      return {};
    }
    const f = filters[fromKey];
    if (!f) {
      return {};
    }

    const res: any = {};
    if (f.base?.longitude != null) {
      res[toKeys.longitude] = f.base?.longitude;
    }
    if (f.base?.latitude != null) {
      res[toKeys.latitude] = f.base?.latitude;
    }
    if (f.radius != null) {
      res[toKeys.radius] = this.distanceService.toKm(f.radius) * 1000;
    }
    return res;
  }
}
