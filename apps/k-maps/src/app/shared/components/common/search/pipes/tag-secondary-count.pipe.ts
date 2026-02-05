import { Pipe, PipeTransform } from '@angular/core';
import { ISearchTagModel } from '../search-model';

@Pipe({
  name: 'secondaryCount',
  pure: false
})
export class McitTagSecondaryCountPipe implements PipeTransform {
  transform(tag: ISearchTagModel, ...args: any[]): any {
    if (!tag) {
      return null;
    }
    return tag.nameKey && tag.secondaries?.filter((s) => s.nameKey)?.length;
  }
}
