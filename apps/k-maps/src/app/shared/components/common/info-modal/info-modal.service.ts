import { Injectable } from '@angular/core';
import { McitInfoModalComponent } from './info-modal.component';
import { Observable } from 'rxjs';
import { McitDialog } from '../dialog/dialog.service';

@Injectable()
export class McitInfoModalService {
  constructor(private dialog: McitDialog) {}

  showInfo(
    title: string,
    messageKey: string,
    dialogClass?: string,
    messageParams?: object,
    extraLines?: { messageKey2?: string; messageKey3?: string; messageParams2?: object; messageParams3?: object },
    link?: { url: string; content?: string },
    options?: { renderMessageAsHtml?: boolean }
  ): Observable<void> {
    const ref = this.dialog.open<McitInfoModalComponent, any, void>(McitInfoModalComponent, {
      dialogClass: dialogClass || 'modal-md',
      data: {
        title,
        message: messageKey,
        messageParams,
        extraLines,
        link,
        options
      }
    });
    return ref.afterClosed();
  }
}
