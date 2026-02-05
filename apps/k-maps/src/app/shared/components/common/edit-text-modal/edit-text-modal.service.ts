import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitEditTextModalComponent } from './edit-text-modal.component';
import { McitDialog } from '../dialog/dialog.service';

@Injectable()
export class McitEditTextModalService {
  constructor(private dialog: McitDialog) {}

  editText(id: string, title: string, value: string, type: 'text' | 'number' | 'email' | 'phone' | 'password', mandatory: boolean = false): Observable<{ value: string }> {
    const ref = this.dialog.open<McitEditTextModalComponent, any, { value: string }>(McitEditTextModalComponent, {
      dialogClass: 'modal-dialog-centered',
      autoFocus: true,
      data: {
        id,
        title,
        value,
        type,
        mandatory
      }
    });
    return ref.afterClosed();
  }
}
