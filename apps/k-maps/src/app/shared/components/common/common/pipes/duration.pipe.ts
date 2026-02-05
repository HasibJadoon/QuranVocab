import { Pipe, PipeTransform } from '@angular/core';
import { buildDuration } from '../../helpers/duration.helper';

@Pipe({
  name: 'duration'
})
export class McitDurationPipe implements PipeTransform {
  transform(value: number): string {
    return buildDuration(value);
  }
}
