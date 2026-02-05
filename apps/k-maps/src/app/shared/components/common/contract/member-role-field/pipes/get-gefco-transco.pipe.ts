import { Pipe, PipeTransform } from '@angular/core';
import { IMemberRole } from '@lib-shared/common/models/member-role.model';

@Pipe({
  name: 'getGefcoTransco'
})
export class GetGefcoTranscoPipe implements PipeTransform {
  public transform(value: IMemberRole): string {
    if (!value) {
      return '';
    }
    return value?.transcoding?.find?.((e) => e?.entity === 'GEFCO')?.x_code ?? value?.obtpop?.tpop_id ?? '';
  }
}
