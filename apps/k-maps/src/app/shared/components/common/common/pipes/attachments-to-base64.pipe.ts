import { Pipe, PipeTransform } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap, concatMap } from 'rxjs/operators';
import { IAttachment } from '../../models/attachments.model';
import { McitCoreEnv } from '../../helpers/provider.helper';
import { editPhotoSize64 } from '@lib-shared/login/helpers/edit-photo-size.helper';
import { McitNativeFileSystem } from '@lib-shared/common/file/native-file-system';

@Pipe({
  name: 'attachToBase64'
})
export class McitAttachmentToBase64Pipe implements PipeTransform {
  constructor(private natveFileSystem: McitNativeFileSystem, private env: McitCoreEnv) {}

  transform(attach: IAttachment, dim?: number): Observable<string> {
    attach.is_loaded = false;
    if (!attach?.local_url && !attach?.remote_url && !attach?.base64) {
      return of(`${this.env?.apiUrl}/v2/common/private/tmp-documents/` + attach?.document_id);
    }

    if (attach?.local_url) {
      return this.natveFileSystem.localUrlToAttach64(attach?.local_url).pipe(
        map((attach64) => attach64.base64),
        concatMap((base64) => {
          if (dim) {
            return editPhotoSize64(base64, dim);
          }
          return of(base64);
        }),
        tap(() => (attach.is_loaded = true))
      );
    }
    return of(attach?.base64 ?? attach?.remote_url).pipe(tap(() => (attach.is_loaded = true)));
  }
}
