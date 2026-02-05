import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../dialog/dialog.service';
import { McitInfoTracableModalComponent } from './info-tracable-modal.component';

@Injectable()
export class McitInfoTracableModalService {
  constructor(private dialog: McitDialog) {}

  open(title: string, trace: any): Observable<any> {
    const ref = this.dialog.open(McitInfoTracableModalComponent, {
      dialogClass: 'modal-sm',
      data: {
        title,
        trace
      }
    });
    return ref.afterClosed();
  }
}
