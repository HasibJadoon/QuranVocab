import { Injectable } from '@angular/core';
import * as lodash from 'lodash';
import { McitTranscodingFilterComponent } from './transcoding-filter.component';
import { FilterType, FilterVisibility, IFilterConfig } from '../search/search-options';
import { CodificationKind } from '../../../../../fvl/src/app/shared/components/codification-search-field/codification-search-field.component';
import { ITranscoding } from '../models/transcoding.model';

@Injectable()
export class McitTranscodingFilterService {
  constructor() {}

  buildTranscodingFilter(
    nameKey: string,
    data: { codificationKind?: CodificationKind; noQuery?: boolean } = {},
    options: { visibility: FilterVisibility; defaultValue: any } = {
      visibility: FilterVisibility.VISIBLE,
      defaultValue: null
    }
  ): IFilterConfig {
    return {
      type: FilterType.CUSTOM,
      nameKey,
      custom: {
        toString: (value: ITranscoding, config: IFilterConfig) => lodash.compact([lodash.get(value, 'entity'), lodash.get(value, 'x_code')]).join(' - '),
        componentType: McitTranscodingFilterComponent,
        data,
        query: {
          toString: (value: ITranscoding) => JSON.stringify(value),
          fromString: (value: string): ITranscoding => JSON.parse(value)
        }
      },
      visibility: options.visibility,
      defaultValue: options.defaultValue
    };
  }
}
