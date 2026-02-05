import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'toMapMemberRole'
})
export class ToMapMemberRolePipe implements PipeTransform {
  public transform<T extends { isHeader: () => boolean; item: { typeTitle: string } }, H extends { value: string }>(matchList: Array<T>, header: H): Array<T> {
    return matchList.filter((element: T) => !element.isHeader() && element.item.typeTitle === header.value);
  }
}
