import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'selectallgroup'
})
export class SelectAllPipeGroup implements PipeTransform {
  transform(value: Array<any>, groupElements: any): boolean {
    if (!value || !groupElements || !groupElements.value || !groupElements.value.results) {
      return false;
    }

    const groupResults = lodash.get(groupElements, 'value.results', []);
    return lodash.some(value, (v) => lodash.some(groupResults, { _id: v._id }));
  }
}
