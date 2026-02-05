import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'hasRole' })
export class HasRolePipe implements PipeTransform {
  transform(roles: Array<any>, value: string, ...args: any[]): boolean {
    if (!roles || !value) {
      return false;
    }
    return !!roles.find((r) => r === value);
  }
}
