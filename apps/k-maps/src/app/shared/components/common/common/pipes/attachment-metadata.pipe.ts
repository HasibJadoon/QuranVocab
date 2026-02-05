import { Pipe, PipeTransform } from '@angular/core';
import { IAttachment } from '../../models/attachments.model';
import { TranslateService } from '@ngx-translate/core';

@Pipe({ name: 'attachMetadata' })
export class McitAttachmentMetadataPipe implements PipeTransform {
  constructor(private translateService: TranslateService) {}

  transform(attach: { meta_data: { [key: string]: string } }): string {
    if (!Object.keys(attach?.meta_data ?? {}).length) {
      return '';
    }
    return Object.entries(attach.meta_data).reduce((acc, [key, val]) => {
      const title = this.translateService.instant(`METADATA.${key.toUpperCase()}`);
      return acc + (acc ? '\n' : '') + `${title}: ${val}`;
    }, '');
  }
}
