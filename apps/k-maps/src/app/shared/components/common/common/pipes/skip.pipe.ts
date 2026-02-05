import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mcitSkip'
})
export class McitSkipPipe implements PipeTransform {
  transform<E>(value: E[], skip: number): E[] {
    if (value == null) {
      return null;
    }
    return value.slice(skip);
  }
}
