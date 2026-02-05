import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IOption, McitChooseMultiOptionsModalComponent } from './choose-multi-options-modal.component';
import { McitDialog } from '../dialog/dialog.service';

@Injectable()
export class McitChooseMultiOptionsModalService {
  constructor(private dialog: McitDialog) {}

  chooseMultiOptions(title: string, options: IOption[], codes: string[]): Observable<string[]> {
    const ref = this.dialog.open<McitChooseMultiOptionsModalComponent, any, string[]>(McitChooseMultiOptionsModalComponent, {
      dialogClass: 'modal-sm modal-dialog-centered',
      data: {
        title,
        options,
        codes
      }
    });
    return ref.afterClosed();
  }
}
