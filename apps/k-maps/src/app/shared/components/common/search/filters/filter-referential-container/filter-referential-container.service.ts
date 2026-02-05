import { Injectable } from '@angular/core';
import { FilterAvailability, FilterType, FilterVisibility, IFilterConfig } from '../../search-options';
import { IReferentialFilterModel, McitFilterReferentialContainerComponent } from './filter-referential-container.component';
import { TranslateService } from '@ngx-translate/core';

export interface IDisplayedFilters {
  place?: boolean;
}

@Injectable()
export class McitFilterReferentialContainerService {
  constructor(private translateService: TranslateService) {}

  buildReferentialFilter(
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
        toString: (value: IReferentialFilterModel, config: IFilterConfig) => {
          let finalString = value.referential[0].name;
          return finalString;
        },
        componentType: McitFilterReferentialContainerComponent,
        data,
        query: {
          toString: (value: IReferentialFilterModel) => JSON.stringify(value),
          fromString: (value: string) => JSON.parse(value)
        }
      },
      visibility: options.visibility,
      defaultValue: options.defaultValue,
      availability: options.availability
    };
  }
}
