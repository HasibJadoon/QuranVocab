import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { DateFilterResultType, FilterType, IFilterConfig, ISearchOptions, TextFilterEncoding, IFilterDate } from './search-options';
import { IFiltersModel, ISearchModel, ISearchTagModel } from './search-model';
import * as lodash from 'lodash';
import { getDatesForMode } from '../helpers/date.helper';
import { DateTime } from 'luxon';
import { McitFilterValuePipe } from './pipes/filter-value.pipe';
import { TranslateService } from '@ngx-translate/core';
import { McitDateTimeService } from '../services/date-time.service';
import { IAxis } from '@lib-shared/common/models/model-group.model';

@Injectable()
export class McitSearchService {
  private filterValuePipe: McitFilterValuePipe;

  constructor(private translateService: TranslateService, private dateTimeService: McitDateTimeService) {
    this.filterValuePipe = new McitFilterValuePipe(translateService, dateTimeService, null);
  }

  /**
   * Transforme de query params vers search model
   */
  queryParamsToSearchModel(searchOptions: ISearchOptions, queryParams: Params, prefix: string = null): ISearchModel {
    const qk = prefix ? `${prefix}_q` : 'q';
    const q = queryParams[qk] ? queryParams[qk] : '';

    let tags: Array<ISearchTagModel>;
    if (searchOptions.tagList) {
      const tagsk = prefix ? `${prefix}_tags` : 'tags';
      tags =
        (queryParams[tagsk] ? queryParams[tagsk] : null)
          ?.split('|')
          ?.map((tagValue) => {
            const tag: IAxis = JSON.parse(decodeURIComponent(tagValue));
            const primaryTagValue = tag.p;
            const tagRestrictions = tag.r;
            const optionsTag = searchOptions.tagList.find((searchTag) => searchTag.value === primaryTagValue && lodash.isEqual(searchTag.restrictions, tagRestrictions));
            return optionsTag?.secondaries
              ? {
                  ...lodash.omit(optionsTag, 'secondaries'),
                  readonly: tag.ro,
                  secondaries: optionsTag.secondaries.filter((s) => tag.s.indexOf(s.value) >= 0)
                }
              : optionsTag;
          })
          ?.filter((tag) => !lodash.isNil(tag)) ?? [];
    }

    const fs: IFiltersModel = {};
    if (searchOptions.filters && searchOptions.filters.filtersConfig) {
      const e = Object.keys(searchOptions.filters.filtersConfig)
        .concat(['q'])
        .map((key) => (prefix ? `${prefix}_${key}` : key))
        .find((key) => !lodash.isNil(queryParams[key]));

      if (e) {
        for (const key of Object.keys(searchOptions.filters.filtersConfig)) {
          const filterConfig = searchOptions.filters.filtersConfig[key];
          const k = prefix ? `${prefix}_${key}` : key;
          const query = queryParams[k];
          if (lodash.isNil(query)) {
            fs[key] = null;
          } else {
            fs[key] = this.fromString(filterConfig, query);
          }
        }
      }
    }

    return {
      text: q,
      tags,
      filters: fs
    };
  }

  /**
   * Transforme de search model vers query params
   */
  searchModelToQueryParams(searchOptions: ISearchOptions, searchBox: ISearchModel, prefix: string = null): Params {
    const params: Params = {};

    const text = lodash.get(searchBox, 'text', null);
    const tags = lodash.get(searchBox, 'tags', null);
    const filters = lodash.get(searchBox, 'filters', {});

    if (text) {
      const k = prefix ? `${prefix}_q` : 'q';
      params[k] = text;
    }
    if (tags) {
      const k = prefix ? `${prefix}_tags` : 'tags';
      params[k] = tags
        .map((tag) => {
          const axis: IAxis = {
            p: tag.value,
            ro: tag.readonly,
            s: tag.secondaries?.map((s) => s.value),
            r: tag.restrictions
          };

          return encodeURIComponent(JSON.stringify(axis));
        })
        .join('|');
    }

    if (filters && searchOptions.filters && searchOptions.filters.filtersConfig) {
      for (const key of Object.keys(searchOptions.filters.filtersConfig)) {
        const filterConfig = searchOptions.filters.filtersConfig[key];

        const value = filters[key];
        if (!lodash.isNil(value)) {
          const k = prefix ? `${prefix}_${key}` : key;
          params[k] = this.toString(filterConfig, value);
        }
      }
    }
    return lodash.omitBy(params, lodash.isNil);
  }

  private fromString(filterConfig: IFilterConfig, query: string): any {
    switch (filterConfig.type) {
      case FilterType.ASYNC_SELECT_LIST:
      case FilterType.AUTOCOMPLETE:
      case FilterType.REDUCED_DATE:
      case FilterType.DATE:
      case FilterType.SIMPLE_DATE:
      case FilterType.NUMBER:
      case FilterType.SIMPLE_NUMBER:
      case FilterType.MULTIAUTOCOMPLETE:
        return JSON.parse(query);
      case FilterType.SELECT_LIST:
        return query;
      case FilterType.TEXT:
        if (filterConfig.text?.encoding === TextFilterEncoding.BASE64) {
          return atob(query);
        } else {
          return query;
        }
      case FilterType.RADIO_LIST:
        return filterConfig.radioList.values.map((it) => it.code).includes(query) ? query : null;
      case FilterType.ASYNC_CHECK_LIST:
        if (filterConfig.asyncCheckList.result === 'array') {
          return JSON.parse(query);
        } else {
          return query;
        }
      case FilterType.CHECK_LIST:
        if (filterConfig.checkList.result === 'array') {
          return JSON.parse(query);
        } else {
          return query;
        }
      case FilterType.TAGS:
        if (filterConfig.tags.result === 'array') {
          return JSON.parse(query);
        } else {
          return query;
        }
      case FilterType.STRINGLIST:
        if (filterConfig.strings.result === 'array') {
          return JSON.parse(query);
        } else {
          return query;
        }
      case FilterType.CUSTOM:
        return filterConfig.custom.query.fromString(query);
    }
    return query;
  }

  private toString(filterConfig: IFilterConfig, value: any): string {
    switch (filterConfig.type) {
      case FilterType.ASYNC_SELECT_LIST:
      case FilterType.AUTOCOMPLETE:
      case FilterType.DATE:
      case FilterType.REDUCED_DATE:
      case FilterType.SIMPLE_DATE:
      case FilterType.NUMBER:
      case FilterType.SIMPLE_NUMBER:
      case FilterType.MULTIAUTOCOMPLETE:
        return JSON.stringify(value);
      case FilterType.SELECT_LIST:
        return value;
      case FilterType.TEXT:
        if (filterConfig.text?.encoding === TextFilterEncoding.BASE64) {
          return btoa(value);
        } else {
          return value;
        }
      case FilterType.RADIO_LIST:
        return value;
      case FilterType.ASYNC_CHECK_LIST:
        if (filterConfig.asyncCheckList.result === 'array') {
          return JSON.stringify(value);
        } else {
          return value;
        }
      case FilterType.CHECK_LIST:
        if (filterConfig.checkList.result === 'array') {
          return JSON.stringify(value);
        } else {
          return value;
        }
      case FilterType.TAGS:
        if (filterConfig.tags.result === 'array') {
          return JSON.stringify(value);
        } else {
          return value;
        }
      case FilterType.STRINGLIST:
        if (filterConfig.strings.result === 'array') {
          return JSON.stringify(value);
        } else {
          return value;
        }
      case FilterType.CUSTOM:
        return filterConfig.custom.query.toString(value);
    }
    return value;
  }

  /**
   * Transforme le filtre date en 2 clefs avec les dates en string
   */
  toFilterDate(filters: any, key: string, fromKey: string, toKey: string, options?: { includeMin?: boolean; includeMax?: boolean; result?: DateFilterResultType }): { [key: string]: string } {
    if (!filters) {
      return {};
    }
    const f = filters[key];

    return this.toFilterDateFrom(f, key, fromKey, toKey, options);
  }

  toFilterNumber(filters: any, key: string): { [key: string]: number } {
    if (!filters) {
      return {};
    }
    const f = filters[key];
    return lodash.omitBy(
      {
        [key + '_gte']: lodash.get(f, 'min.operator', null) === 'gte' ? f.min.value?.toString() : null,
        [key + '_gt']: lodash.get(f, 'min.operator', null) === 'gt' ? f.min.value?.toString() : null,
        [key + '_lte']: lodash.get(f, 'max.operator', null) === 'lte' ? f.max.value?.toString() : null,
        [key + '_lt']: lodash.get(f, 'max.operator', null) === 'lt' ? f.max.value?.toString() : null
      },
      lodash.isNil
    );
  }

  /**
   * Transforme le filtre date en 2 clefs avec les dates en string
   */
  toFilterDateFrom(filter: IFilterDate & { [key: string]: any }, key: string, fromKey: string, toKey: string, options?: { includeMin?: boolean; includeMax?: boolean; result?: DateFilterResultType }): { [key: string]: string } {
    if (!filter) {
      return {};
    }

    const { includeMin, includeMax, result } = lodash.defaults(
      {
        ...filter.date,
        ...options
      } ?? {},
      { includeMin: true, includeMax: false, result: 'local' }
    );

    let min: DateTime;
    let max: DateTime;
    if (filter.mode === 'range' || filter.mode === 'rangeWithTime') {
      min = lodash.get(filter, 'min.value', null) ? DateTime.fromISO(filter.min.value) : null;
      max = lodash.get(filter, 'max.value', null) ? DateTime.fromISO(filter.max.value) : null;
    } else if (filter.mode === 'filled' || filter.mode === 'empty') {
      return {
        [key]: filter.mode === 'filled' ? '$SET$' : '$UNSET$'
      };
    } else {
      const res = getDatesForMode(filter.mode, includeMin, includeMax);
      min = res.min ? DateTime.fromJSDate(res.min) : null;
      max = res.max ? DateTime.fromJSDate(res.max) : null;
    }

    return {
      [fromKey]: this.convertDate(min, result, filter.mode === 'rangeWithTime'),
      [toKey]: this.convertDate(max, result, filter.mode === 'rangeWithTime')
    };
  }

  private convertDate(date: DateTime, result: DateFilterResultType, withTime: boolean = false): string {
    if (!date) {
      return null;
    }
    return result === 'local' ? (withTime ? date.toISODate() + 'T' + date.toISOTime().substring(0, 8) : date.toISODate()) : withTime ? date.toJSDate().toISOString() : date.startOf('day').toJSDate().toISOString();
  }

  searchModelToKeyword(searchOptions: ISearchOptions, searchBox: ISearchModel): string {
    const ss = [];

    const text = lodash.get(searchBox, 'text', null);
    const filters = lodash.get(searchBox, 'filters', {});

    if (text) {
      ss.push({ key: 'q', value: text });
    }

    if (filters && searchOptions.filters && searchOptions.filters.filtersConfig) {
      for (const key of Object.keys(searchOptions.filters.filtersConfig)) {
        const filterConfig = searchOptions.filters.filtersConfig[key];

        const value = filters[key];
        if (!lodash.isNil(value)) {
          ss.push({ key: filterConfig.nameKey, value: this.filterValuePipe.transform(value, filterConfig) });
        }
      }
    }

    return ss
      .map((kv) => {
        const v = lodash.replace(lodash.deburr(kv.value), new RegExp('[^a-zA-Z0-9()\\[\\]_\\-+*,;<>=:&]', 'g'), ' ');
        return `${kv.key}="${v}"`;
      })
      .join(';');
  }
}
