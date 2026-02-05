import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

interface ITypeIcon {
  [key: string]: string;
}

const TYPE_ICONS: ITypeIcon = {
  street_address: 'far fa-road',
  country: 'far fa-flag',
  establishment: 'far fa-building',
  locality: 'far fa-city',
  premise: 'far fa-map-marker',
  transit_station: 'far fa-train',
  train_station: 'far fa-train',
  hospital: 'far fa-hospital'
};

@Pipe({
  name: 'placeicon',
  pure: true
})
export class McitPlaceIconPipe implements PipeTransform {
  transform(value: string | string[]): any {
    let types;
    if (lodash.isString(value)) {
      types = [value];
    } else if (lodash.isArray(value)) {
      types = value;
    }
    if (types) {
      const typeIcon: ITypeIcon = lodash.head(types.map((type) => TYPE_ICONS[type]).filter((ti) => ti));
      if (typeIcon) {
        return typeIcon;
      }
    }
    return 'far fa-map-marker';
  }
}
