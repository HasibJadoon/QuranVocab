import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'transcoding'
})
export class McitTranscodingPipe implements PipeTransform {
  transform(value: any, ...args: any[]): any {
    if (value?.transcoding) {
      const entity = args?.length > 0 ? args[0] : 'GEFCO';
      const transcoding = value.transcoding.find((res) => res.entity === entity);
      return transcoding?.x_code || null;
    }
    return null;
  }
}
