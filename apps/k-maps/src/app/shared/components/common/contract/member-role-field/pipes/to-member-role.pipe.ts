import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';
import { IMemberRole } from '@lib-shared/common/models/member-role.model';

@Pipe({
  name: 'tomemberrole'
})
export class ToMemberRolePipe implements PipeTransform {
  constructor() {}

  transform(value: IMemberRole, ...args: any[]): any {
    if (!value) {
      return null;
    }

    const mode = lodash.get(args, '[0]');

    let res;
    switch (mode) {
      case 'full':
        res = [value.name, value.address1, value.address2, value.address3, value.zip, value.city, lodash.get(value.country, 'name')].filter(Boolean).join(' ');
        break;
      case 'zip_city':
        res = [value.zip, value.city].filter(Boolean).join(' ');
        break;
    }
    return res ? res : value.name;
  }
}
