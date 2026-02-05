import { Injectable } from '@angular/core';
import * as lodash from 'lodash';
import { FilterAvailability, FilterType, FilterVisibility, IFilterConfig, ITpzcContainer } from '../../search-options';
import { ITpzcFilterModel, McitFilterTpzcContainerComponent, ThirdPartyOperator } from './filter-tpzc-container.component';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

export interface IDisplayedFilters {
  third_party?: boolean;
  place?: boolean;
  zip?: boolean;
  city?: boolean;
  country?: boolean;
  zone?: boolean;
  state?: boolean;
}

@Injectable()
export class McitFilterTpzcContainerService {
  constructor(private translateService: TranslateService) {}

  buildTpzcFilter(
    nameKey: string,
    data: {
      autocomplete: (q: string, per_page: number) => Observable<{ id: string; name: string; description: string }[]>;
      contextId?: string;
      params?: any;
    },
    options: { visibility: FilterVisibility; defaultValue: any; availability?: FilterAvailability; showThirdPlaceOperator?: boolean; showInNotInOperator?: boolean } = {
      visibility: FilterVisibility.VISIBLE,
      defaultValue: null,
      showThirdPlaceOperator: false,
      showInNotInOperator: false
    }
  ): ITpzcContainer {
    return {
      type: FilterType.CUSTOM,
      nameKey,
      custom: {
        toString: (value: ITpzcFilterModel, config: IFilterConfig) => {
          let finalString = '';
          let classColor = '';
          const isinGroupagePickadDeleiveryFilter = this.appliedColorFormat(config.nameKey);
          if (value.third_party && lodash.isArray(value.third_party) && value.third_party.length > 0) {
            if (!isinGroupagePickadDeleiveryFilter && value.third_party_operator === ThirdPartyOperator.NOT_IN) {
              finalString += ' ' + this.translateService.instant('FILTER_TPZC.THIRD_PARTY_OPERATOR_NOT_IN');
            }

            classColor = !isinGroupagePickadDeleiveryFilter ? '' : value.third_party_operator === ThirdPartyOperator.NOT_IN ? 'red-not-in' : 'green-in';
            const names = value.third_party.map((v) => v.name).join(', ');

            finalString += this.translateService.instant('FILTER_TPZC.THIRD_PARTY_COLOR') + '<span class="' + classColor + '" >' + names + '</span>';
          }
          if (value.place && lodash.isArray(value.place) && value.place.length > 0) {
            classColor = !isinGroupagePickadDeleiveryFilter ? '' : value.place_operator === ThirdPartyOperator.NOT_IN ? 'red-not-in' : 'green-in';
            const names = value.place.map((v) => v.name).join(', ');

            finalString += ' ' + this.translateService.instant('FILTER_TPZC.PLACE_COLOR') + '<span class="' + classColor + '" >' + names + '</span>';
          }
          if (value.zip && lodash.isArray(value.zip) && value.zip.length > 0) {
            classColor = !isinGroupagePickadDeleiveryFilter ? '' : value.zip_operator === ThirdPartyOperator.NOT_IN ? 'red-not-in' : 'green-in';
            const names = value.zip.map((v) => v.zip).join(', ');
            finalString += ' ' + this.translateService.instant('FILTER_TPZC.ZIP_COLOR') + '<span class="' + classColor + '" >' + names + '</span>';
          }
          if (value.city && lodash.isArray(value.city) && value.city.length > 0) {
            classColor = !isinGroupagePickadDeleiveryFilter ? '' : value.city_operator === ThirdPartyOperator.NOT_IN ? 'red-not-in' : 'green-in';
            const names = value.city.map((v) => v.city).join(', ');
            finalString += ' ' + this.translateService.instant('FILTER_TPZC.CITY_COLOR') + '<span class="' + classColor + '" >' + names + '</span>';
          }
          if (value.country && lodash.isArray(value.country) && value.country.length > 0) {
            classColor = !isinGroupagePickadDeleiveryFilter ? '' : value.country_operator === ThirdPartyOperator.NOT_IN ? 'red-not-in' : 'green-in';
            const names = value.country.map((v) => v.name).join(', ');
            finalString += ' ' + this.translateService.instant('FILTER_TPZC.COUNTRY_COLOR') + '<span class="' + classColor + '" >' + names + '</span>';
          }
          if (value.zone && lodash.isArray(value.zone) && value.zone.length > 0) {
            classColor = !isinGroupagePickadDeleiveryFilter ? '' : value.zone_operator === ThirdPartyOperator.NOT_IN ? 'red-not-in' : 'green-in';
            const names = value.zone.map((v) => v.name).join(', ');
            finalString += ' ' + this.translateService.instant('FILTER_TPZC.ZONE_COLOR') + '<span class="' + classColor + '" >' + names + '</span>';
          }
          if (value.state && lodash.isArray(value.state) && value.state.length > 0 && data?.params?.display?.state) {
            classColor = !isinGroupagePickadDeleiveryFilter ? '' : value.state_operator === ThirdPartyOperator.NOT_IN ? 'red-not-in' : 'green-in';
            const names = value.state.map((v) => v.state).join(', ');
            finalString += ' ' + this.translateService.instant('FILTER_TPZC.STATE_COLOR') + '<span class="' + classColor + '" >' + names + '</span>';
          }
          return finalString;
        },
        componentType: McitFilterTpzcContainerComponent,
        data,
        query: {
          toString: (value: ITpzcFilterModel) => JSON.stringify(value),
          fromString: (value: string) => JSON.parse(value)
        }
      },
      visibility: options.visibility,
      defaultValue: options.defaultValue,
      availability: options.availability,
      showThirdPlaceOperator: options.showThirdPlaceOperator,
      showInNotInOperator: options.showInNotInOperator
    };
  }

  toTpzcFilter(
    filters: any,
    fromKey: string,
    toKeys: {
      thirdPartyId?: string;
      thirdPartyOperator?: string;
      placeId?: string;
      placeOperator?: string;
      zip?: string;
      zipOperator?: string;
      city?: string;
      cityOperator?: string;
      country?: string;
      countryOperator?: string;
      zone?: string;
      zoneOperator?: string;
      state?: string;
      stateOperator?: string;
      checkbox?: string;
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
    if (f.third_party && f.third_party.length > 0) {
      res[toKeys.thirdPartyId] = lodash.cloneDeep(f.third_party.map((v) => v.id));
      if (f.third_party_operator) {
        res[toKeys.thirdPartyOperator] = f.third_party_operator;
      }
    }

    if (f.place && f.place.length > 0) {
      res[toKeys.placeId] = f.place.map((v) => v.id);
      if (f.place_operator) {
        res[toKeys.placeOperator] = f.place_operator;
      }
    }

    if (f.country && f.country.length > 0) {
      res[toKeys.country] = f.country.map((v) => v.code);
      if (f.country_operator) {
        res[toKeys.countryOperator] = f.country_operator;
      }
    }
    if (f.zip && f.zip.length > 0) {
      res[toKeys.zip] = f.zip.map((v) => v.zip);
      if (f.zip_operator) {
        res[toKeys.zipOperator] = f.zip_operator;
      }
    }

    if (f.city && f.city.length > 0) {
      res[toKeys.city] = f.city.map((v) => v.city);
      if (f.city_operator) {
        res[toKeys.cityOperator] = f.city_operator;
      }
    }

    if (f.zone && f.zone.length > 0) {
      res[toKeys.zone] = f.zone.map((v) => v.id);
      if (f.zone_operator) {
        res[toKeys.zoneOperator] = f.zone_operator;
      }
    }
    if (f.state && f.state.length > 0) {
      res[toKeys.state] = f.state.map((v) => v.state);
      if (f.state_operator) {
        res[toKeys.stateOperator] = f.state_operator;
      }
    }
    if (f.checkboxChecked) {
      res[toKeys.checkbox] = f.checkboxChecked;
    }
    return res;
  }

  appliedColorFormat(nameKey: string): boolean {
    return nameKey == 'GROUPAGE_COMPONENT.FILTERS.PICKUP' || nameKey == 'GROUPAGE_COMPONENT.FILTERS.DELIVERY';
  }
}
