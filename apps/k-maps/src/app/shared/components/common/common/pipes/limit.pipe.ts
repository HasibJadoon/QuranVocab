import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mcitLimit'
})
export class McitLimitPipe implements PipeTransform {
  transform<E>(value: E[], limit: number): E[] {
    if (value == null) {
      return null;
    }
    return value.slice(0, limit);
  }
}
