import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitChooseOptionsModalComponent, IOptions, IItem } from './choose-options-modal.component';
import { McitDialog } from '../dialog/dialog.service';

@Injectable()
export class McitChooseOptionsModalService {
  constructor(private dialog: McitDialog) {}

  chooseOptions(title: string, values: IItem[], code: string, options?: IOptions): Observable<string> {
    const ref = this.dialog.open<McitChooseOptionsModalComponent, any, string>(McitChooseOptionsModalComponent, {
      dialogClass: 'modal-sm modal-dialog-centered',
      disableClose: false,
      data: {
        title,
        values,
        options,
        code
      }
    });
    return ref.afterClosed();
  }
}
