import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../dialog/dialog.service';
import { McitConfirmModalComponent } from './confirm-modal.component';

export interface IMcitConfirmExtras {
  titleParams?: object;
  messageParams?: object;
  disableClose?: boolean;
  dialogClass?: string;
  extraKey1?: string;
  extraKey2?: string;
  extraParams1?: object;
  extraParams2?: object;
  extrasActionKey?: string;
  innerHtmlMessage?: boolean;
  innerHtmlKey1?: boolean;
  innerHtmlKey2?: boolean;
}

@Injectable()
export class McitConfirmModalService {
  constructor(private dialog: McitDialog) {}

  showConfirm(titleKey: string, messageKey: string, extras?: IMcitConfirmExtras): Observable<void> {
    const ref = this.dialog.open<McitConfirmModalComponent, any, void>(McitConfirmModalComponent, {
      dialogClass: extras?.dialogClass ?? 'modal-lg modal-dialog-centered',
      disableClose: extras ? extras.disableClose : false,
      hasBackdrop: true,
      data: {
        title: titleKey,
        messageKey,
        extras
      }
    });
    return ref.afterClosed();
  }
}
