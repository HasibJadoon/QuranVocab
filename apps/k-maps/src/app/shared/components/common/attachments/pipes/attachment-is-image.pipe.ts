import { Pipe, PipeTransform } from '@angular/core';
import { IAttachment } from '../../models/attachments.model';

@Pipe({ name: 'attachIsImage' })
export class McitAttachmentIsImagePipe implements PipeTransform {
  constructor() {}

  transform(attach: IAttachment): boolean {
    if (!attach) {
      return false;
    }

    return attach.name?.toString().endsWith('jpeg') || attach.name?.toString().endsWith('jpg');
  }
}
