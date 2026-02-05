import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../dialog/dialog.service';
import { IOptions, McitAceEditorModalComponent } from './ace-editor-modal.component';

@Injectable()
export class McitAceEditorModalService {
  constructor(private dialog: McitDialog) {}

  open(title: string, object: any, options?: IOptions): Observable<object> {
    const ref = this.dialog.open<McitAceEditorModalComponent, { title: string; object: object; options: IOptions }, object>(McitAceEditorModalComponent, {
      dialogClass: 'modal-lg modal-dialog-centered',
      data: {
        title,
        object,
        options
      }
    });
    return ref.afterClosed();
  }
}
