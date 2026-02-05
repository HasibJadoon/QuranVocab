import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import * as lodash from 'lodash';
import { ICategoriesModel, IFacetModel } from './facet-model';
import { CategoryType, ICategoryConfig, IFacetOptions } from './facet-options';

@Injectable()
export class McitFacetService {
  constructor() {}

  /**
   * Transforme de query params vers facet model
   */
  queryParamsToFacetModel(facetOptions: IFacetOptions, queryParams: Params, prefix: string = null): IFacetModel {
    const fs: ICategoriesModel = {};
    if (facetOptions.categories?.categoriesConfig) {
      const e = Object.keys(facetOptions.categories.categoriesConfig)
        .map((key) => (prefix ? `${prefix}_${key}` : key))
        .find((key) => !lodash.isEmpty(queryParams[key]));

      if (e) {
        for (const key of Object.keys(facetOptions.categories.categoriesConfig)) {
          const filterConfig = facetOptions.categories.categoriesConfig[key];

          const k = prefix ? `${prefix}_${key}` : key;
          const query = queryParams[k];
          if (!lodash.isEmpty(query)) {
            if (filterConfig.selection === 'multi') {
              fs[key] = query.split(',').map((q) => this.fromString(filterConfig, q));
            } else {
              fs[key] = this.fromString(filterConfig, query);
            }
          }
        }
      }
    }

    return {
      categories: fs
    };
  }

  /**
   * Transforme de facet model vers query params
   */
  facetModelToQueryParams(facetOptions: IFacetOptions, facetBox: IFacetModel, prefix: string = null): Params {
    const params: Params = {};

    const categories = lodash.get(facetBox, 'categories', {});

    if (categories && facetOptions.categories?.categoriesConfig) {
      for (const key of Object.keys(facetOptions.categories.categoriesConfig)) {
        const categoryConfig = facetOptions.categories.categoriesConfig[key];

        const value = categories[key];
        if (!lodash.isEmpty(value)) {
          const k = prefix ? `${prefix}_${key}` : key;
          if (categoryConfig.selection === 'multi' && lodash.isArray(value)) {
            params[k] = value.map((v) => this.toString(categoryConfig, v)).join(',');
          } else {
            params[k] = this.toString(categoryConfig, value);
          }
        }
      }
    }

    return lodash.omitBy(params, lodash.isNil);
  }

  private fromString(categoryConfig: ICategoryConfig, query: string): any {
    switch (categoryConfig.type) {
      case CategoryType.STANDARD:
        return query;
      case CategoryType.BUCKET:
      case CategoryType.BUCKET_AUTO:
      case CategoryType.GEO_DISTANCE:
      case CategoryType.DAYS_SINCE:
        return JSON.parse(query);
    }
    return query;
  }

  private toString(categoryConfig: ICategoryConfig, value: any): string {
    switch (categoryConfig.type) {
      case CategoryType.STANDARD:
        return value;
      case CategoryType.BUCKET:
      case CategoryType.BUCKET_AUTO:
      case CategoryType.GEO_DISTANCE:
      case CategoryType.DAYS_SINCE:
        return JSON.stringify(value);
    }
    return value;
  }

  toCategoryBucket(filters: any, key: string, minKey?: string, maxKey?: string): { [key: string]: string } {
    if (!filters) {
      return {};
    }
    const f = filters[key];

    return lodash.omitBy(
      {
        [minKey ?? `gt_${key}`]: f?.gt,
        [maxKey ?? `gte_${key}`]: f?.gte,
        [minKey ?? `lt_${key}`]: f?.lt,
        [maxKey ?? `lte_${key}`]: f?.lte
      },
      lodash.isNil
    );
  }

  toCategoryBucketAuto(filters: any, key: string, minKey?: string, maxKey?: string): { [key: string]: string } {
    if (!filters) {
      return {};
    }
    const f = filters[key];

    return lodash.omitBy(
      {
        [minKey ?? `gt_${key}`]: f?.gt,
        [maxKey ?? `gte_${key}`]: f?.gte,
        [minKey ?? `lt_${key}`]: f?.lt,
        [maxKey ?? `lte_${key}`]: f?.lte
      },
      lodash.isNil
    );
  }

  toCategoryGeoDistance(filters: any, key: string, latitudeBaseKey?: string, longitudeBaseKey?: string, minKey?: string, maxKey?: string): { [key: string]: string } {
    if (!filters) {
      return {};
    }
    const f = filters[key];

    return lodash.omitBy(
      {
        [latitudeBaseKey ?? `latitude_base_${key}`]: f?.base?.latitude,
        [longitudeBaseKey ?? `longitude_base_${key}`]: f?.base?.longitude,
        [minKey ?? `gt_${key}`]: f?.gt,
        [maxKey ?? `gte_${key}`]: f?.gte,
        [minKey ?? `lt_${key}`]: f?.lt,
        [maxKey ?? `lte_${key}`]: f?.lte
      },
      lodash.isNil
    );
  }

  toCategoryDaysSince(filters: any, key: string, baseKey?: string, minKey?: string, maxKey?: string): { [key: string]: string } {
    if (!filters) {
      return {};
    }
    const f = filters[key];

    return lodash.omitBy(
      {
        [baseKey ?? `base_${key}`]: f?.base,
        [minKey ?? `gt_${key}`]: f?.gt,
        [maxKey ?? `gte_${key}`]: f?.gte,
        [minKey ?? `lt_${key}`]: f?.lt,
        [maxKey ?? `lte_${key}`]: f?.lte
      },
      lodash.isNil
    );
  }
}
