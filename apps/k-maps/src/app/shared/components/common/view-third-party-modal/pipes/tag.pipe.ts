import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'tag' })
export class TagPipe implements PipeTransform {
  transform(value: Array<any>, ...args: any[]): Array<string> {
    if (!value) {
      return [];
    }
    return value.find((e) => e.kind === args[0])?.values ?? [];
  }
}
