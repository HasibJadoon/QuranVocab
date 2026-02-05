import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getHeaderMemberRole'
})
export class GetHeaderMemberRolePipe implements PipeTransform {
  transform<T extends { isHeader: () => boolean }>(collection: Array<T>): Array<T> {
    return collection.filter((element: T) => element.isHeader());
  }
}
