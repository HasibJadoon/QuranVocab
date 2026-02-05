import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'debug'
})
export class DebugPipe implements PipeTransform {
  transform(value: unknown): unknown {
    console.log(value);
    return value;
  }
}
