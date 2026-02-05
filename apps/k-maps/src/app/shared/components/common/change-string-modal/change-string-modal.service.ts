import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../dialog/dialog.service';
import { McitChangeStringModalComponent } from './change-string-modal.component';

export interface IMcitChangeStringExtras {
  titleParams?: object;
  messageParams?: object;
  disableClose?: boolean;
  dialogClass?: string;
  extrasActionKey?: string;
  regex?: RegExp; //Example: /^[A-Z0-9]+$/
}

@Injectable()
export class McitChangeStringModalService {
  constructor(private dialog: McitDialog) {}

  showConfirm(titleKey: string, messageKey: string, value: string, extras?: IMcitChangeStringExtras): Observable<string> {
    const ref = this.dialog.open<McitChangeStringModalComponent, any, string>(McitChangeStringModalComponent, {
      dialogClass: extras?.dialogClass ?? 'modal-lg modal-dialog-centered',
      disableClose: extras ? extras.disableClose : false,
      hasBackdrop: true,
      data: {
        title: titleKey,
        messageKey,
        value,
        extras
      }
    });
    return ref.afterClosed();
  }
}
