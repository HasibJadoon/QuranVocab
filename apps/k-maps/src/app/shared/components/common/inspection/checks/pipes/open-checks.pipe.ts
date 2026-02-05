import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';

@Pipe({
  name: 'openChecks'
})
export class McitOpenChecksPipe implements PipeTransform {
  transform(grpChkQuestion: any, isEditable: boolean, initGroupProgress: any[], resumeGroupKey: number): boolean {
    if (lodash.toString(resumeGroupKey) === grpChkQuestion?.key) {
      return true;
    }
    return isEditable ? (initGroupProgress && initGroupProgress[grpChkQuestion.key] ? initGroupProgress[grpChkQuestion.key] !== 2 : true) : true;
  }
}
