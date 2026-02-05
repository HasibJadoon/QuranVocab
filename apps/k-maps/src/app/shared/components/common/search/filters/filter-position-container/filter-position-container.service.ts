import { Injectable } from '@angular/core';
import * as lodash from 'lodash';
import { FilterAvailability, FilterType, FilterVisibility, IFilterConfig } from '../../search-options';
import { IPositionFilterModel, McitFilterPositionContainerComponent } from './filter-position-container.component';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

export interface IDisplayedFilters {
  place?: boolean;
}

@Injectable()
export class McitFilterPositionContainerService {
  constructor(private translateService: TranslateService) {}

  buildPositionFilter(
    nameKey: string,
    data?: {
      contextId?: string;
      params?: any;
    },
    options: { visibility: FilterVisibility; defaultValue: any; availability?: FilterAvailability } = {
      visibility: FilterVisibility.VISIBLE,
      defaultValue: null
    }
  ): IFilterConfig {
    return {
      type: FilterType.CUSTOM,
      nameKey,
      custom: {
        toString: (value: IPositionFilterModel, config: IFilterConfig) => {
          let finalString = '';
          if (value.zone && lodash.isArray(value.zone) && value.zone.length > 0) {
            finalString +=
              ' ' +
              this.translateService.instant('FILTER_POSITION.ZONE', {
                name: value.zone.map((v) => v.name).join(', ')
              });
          }
          return finalString;
        },
        componentType: McitFilterPositionContainerComponent,
        data,
        query: {
          toString: (value: IPositionFilterModel) => JSON.stringify(value),
          fromString: (value: string) => JSON.parse(value)
        }
      },
      visibility: options.visibility,
      defaultValue: options.defaultValue,
      availability: options.availability
    };
  }
}
