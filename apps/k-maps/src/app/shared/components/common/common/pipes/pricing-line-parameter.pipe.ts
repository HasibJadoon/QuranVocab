import { DecimalPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { isEqual, isNumber } from 'lodash';
import { IPricingCriterion } from 'projects/lib-shared/src/lib/common/contract/contract.model';

@Pipe({ name: 'pricinglineparameter' })
export class McitPricingLineParameterPipe implements PipeTransform {
  private libelleObject = {
    VIN_FIXED: {
      name: 'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.PRICING.FIXED_PRICE.RESUME',
      param: (v) => (v.vin_pricing.fixed_price ? Object({ fixed_priced: v.vin_pricing.fixed_price }) : v.vin_pricing.fixed_price === 0 ? Object({ fixed_priced: v.vin_pricing.fixed_price }) : null)
    },
    VIN_KM: {
      name: 'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.PRICING.KM.RESUME',
      param: (v) => v.vin_pricing.km
    },
    VIN_RANGE: {
      name: 'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.PRICING.RANGE.RESUME',
      param: (v) => v.vin_pricing.range
    },
    VIN_CATEGORY_FIXED: {
      name: 'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.PRICING.CATEGORIES.RESUME',
      param: (v) => (v.vin_pricing.categories_fixed ? Object({ length: Object.keys(v.vin_pricing.categories_fixed).length }) : null)
    },
    VIN_CATEGORY_KM: {
      name: 'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.PRICING.CATEGORIES.RESUME',
      param: (v) => (v.vin_pricing.categories_km ? Object({ length: v.vin_pricing.categories_km.length }) : null)
    },
    VIN_CATEGORY_RANGE: {
      name: 'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.PRICING.CATEGORIES.RESUME',
      param: (v) => (v.vin_pricing.categories_range ? Object({ length: v.vin_pricing.categories_range.length }) : null)
    },
    TRIP_FIXED: {
      name: 'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.PRICING.FIXED_PRICE.RESUME',
      param: (v) => (v.trip_pricing.fixed_price ? Object({ fixed_priced: v.trip_pricing.fixed_price }) : v.trip_pricing.fixed_price === 0 ? Object({ fixed_priced: v.trip_pricing.fixed_price }) : null)
    },
    TRIP_KM: {
      name: 'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.PRICING.KM.RESUME',
      param: (v) => v.trip_pricing.km
    },
    TRIP_RANGE: {
      name: 'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.PRICING.RANGE.RESUME',
      param: (v) => v.trip_pricing.range
    },
    TRIP_CATEGORY_FIXED: {
      name: 'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.PRICING.CATEGORIES.RESUME',
      param: (v) => (v.trip_pricing.categories_fixed ? Object({ length: v.trip_pricing.categories_fixed.length }) : null)
    },
    TRIP_CATEGORY_KM: {
      name: 'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.PRICING.CATEGORIES.RESUME',
      param: (v) => (v.trip_pricing.categories_km ? Object({ length: v.trip_pricing.categories_km.length }) : null)
    },
    TRIP_CATEGORY_RANGE: {
      name: 'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.PRICING.CATEGORIES.RESUME',
      param: (v) => (v.trip_pricing.categories_range ? Object({ length: v.trip_pricing.categories_range.length }) : null)
    },
    PRICING_GRID: {
      name: 'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.PRICING_GRID.RESUME',
      param: (v) => (isNumber(v.pricing_grid.lines) ? Object({ length: v.pricing_grid.lines, file_name: v.pricing_grid.file_name }) : null)
    },
    PRICING_CLIENT: {
      name: [
        'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.PRICING_CLIENT.RESUME.DEFAULT',
        'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.PRICING_CLIENT.RESUME.AMOUNT',
        'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.PRICING_CLIENT.RESUME.PERCENTAGE'
      ],
      param: (v) => {
        if (v.pricing_client?.amount) {
          return Object({ amount: v.pricing_client.amount, currency: v.pricing_client.currency, type: 'amount' });
        }
        if (v.pricing_client?.percentage) {
          return Object({ percentage: v.pricing_client.percentage, type: 'percentage' });
        }
        if (v.pricing_client?.type) {
          return Object({ type: 'default' });
        }
        return null;
      }
    },
    PRICING_SUPPLIER: {
      name: [
        'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.PRICING_SUPPLIER.RESUME.DEFAULT',
        'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.PRICING_SUPPLIER.RESUME.AMOUNT',
        'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.PRICING_SUPPLIER.RESUME.PERCENTAGE'
      ],
      param: (v) => {
        if (v.pricing_supplier?.amount) {
          return Object({
            contract: v.pricing_supplier.contract.name,
            amount: v.pricing_supplier.amount,
            currency: v.pricing_supplier.currency,
            type: 'amount'
          });
        }
        if (v.pricing_supplier?.percentage) {
          return Object({
            contract: v.pricing_supplier.contract.name,
            percentage: v.pricing_supplier.percentage,
            type: 'percentage'
          });
        }
        if (v.pricing_supplier?.type) {
          return Object({ contract: v.pricing_supplier.contract.name, type: 'default' });
        }
        return null;
      }
    },
    DISTANCE: {
      name: 'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.MEANS_PRICING.DISTANCE_RESUME',
      param: (v) =>
        v?.distance_pricing?.distance_pricing_grid?.length > 0
          ? {
              length: v.distance_pricing.distance_pricing_grid.length
            }
          : null
    },
    DAY: {
      name: 'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.MEANS_PRICING.DAY_RESUME',
      param: (v) =>
        v?.day_pricing?.price_per_day
          ? {
              tarif_code: v.day_pricing.tarif_code || '',
              price_per_day: v.day_pricing.price_per_day,
              day_included_bunker_unit_price: v.day_pricing.day_included_bunker_unit_price ? `(bunker: ${this.decimalPipe.transform(v.day_pricing.day_included_bunker_unit_price, '.0-2')})` : ''
            }
          : null
    },
    DAY_DISTANCE: {
      name: 'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.MEANS_PRICING.DAY_DISTANCE_RESUME',
      param: (v) =>
        v?.day_distance_pricing?.price_per_day || v?.pricing?.day_distance_pricing?.price_per_distance
          ? {
              tarif_code: v.day_distance_pricing.tarif_code || '',
              price_per_day: v.day_distance_pricing.price_per_day,
              price_per_distance: v.day_distance_pricing.price_per_distance,
              day_included_bunker_unit_price: v.day_distance_pricing.day_included_bunker_unit_price ? `(bunker: ${this.decimalPipe.transform(v.day_distance_pricing.day_included_bunker_unit_price, '.0-2')})` : '',
              distance_included_bunker_unit_price: v.day_distance_pricing.distance_included_bunker_unit_price ? `(bunker: ${this.decimalPipe.transform(v.day_distance_pricing.distance_included_bunker_unit_price, '.0-2')})` : ''
            }
          : null
    },
    DISTANCE_RANGE: {
      name: 'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.MEANS_PRICING.DISTANCE_RESUME',
      param: (v) =>
        v?.distance_range_pricing?.distance_range_pricing_grid?.length > 0
          ? {
              length: v.distance_range_pricing.distance_range_pricing_grid.length
            }
          : null
    }
  };

  constructor(private readonly translateService: TranslateService, private readonly decimalPipe: DecimalPipe) {}

  transform(value: IPricingCriterion, ...args: any[]): string {
    let libelle = null;
    const builder = this.libelleObject[(value as IPricingCriterion).formula];
    if (builder.param(value) && !isEqual(builder.param(value), {})) {
      switch (builder.param(value).type) {
        case 'amount': {
          libelle = this.translateService.instant(builder.name[1], builder.param(value));
          break;
        }
        case 'percentage': {
          libelle = this.translateService.instant(builder.name[2], builder.param(value));
          break;
        }
        case 'default': {
          libelle = this.translateService.instant(builder.name[0], builder.param(value));
          break;
        }
        default: {
          libelle = this.translateService.instant(builder.name, builder.param(value));
        }
      }
    }
    return libelle;
  }
}
