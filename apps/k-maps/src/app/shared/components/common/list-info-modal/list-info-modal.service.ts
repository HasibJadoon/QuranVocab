import { Injectable } from '@angular/core';
import { McitListInfoModalComponent } from './list-info-modal.component';
import { Observable } from 'rxjs';
import { McitDialog } from '../dialog/dialog.service';

@Injectable()
export class McitListInfoModalService {
  constructor(private dialog: McitDialog) {}

  showInfo(title: string, list: { k: string; v: string }[], dialogClass?: string): Observable<void> {
    const ref = this.dialog.open<McitListInfoModalComponent, any, void>(McitListInfoModalComponent, {
      dialogClass: dialogClass || 'modal-md',
      data: {
        title,
        list: list
      }
    });
    return ref.afterClosed();
  }
}
