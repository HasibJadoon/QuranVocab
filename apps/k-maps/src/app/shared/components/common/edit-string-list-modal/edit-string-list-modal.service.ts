import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../dialog/dialog.service';
import { McitEditStringListModalComponent } from './edit-string-list-modal.component';

@Injectable()
export class McitEditStringListModalService {
  constructor(private dialog: McitDialog) {}

  open(strings: string[], readOnly: boolean): Observable<any> {
    const ref = this.dialog.open<McitEditStringListModalComponent, any, any>(McitEditStringListModalComponent, {
      dialogClass: 'modal-lg',
      data: {
        strings,
        readOnly
      }
    });
    return ref.afterClosed();
  }
}
