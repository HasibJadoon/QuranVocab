import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';
import { ISearchTagModel } from '../search-model';

@Pipe({
  name: 'secondaryEditable',
  pure: true
})
export class McitTagSecondaryEditablePipe implements PipeTransform {
  transform(tag: ISearchTagModel, tagList: Array<ISearchTagModel>): boolean {
    return (tagList.find((t) => t.value === tag.value && lodash.isEqual(t.restrictions, tag.restrictions))?.secondaries?.filter((s) => s.nameKey)?.length ?? 0) > (tag.nameKey ? 0 : 1);
  }
}
