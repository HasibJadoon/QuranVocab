import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitEditTextAreaModalComponent } from './edit-text-area-modal.component';
import { McitDialog } from '../dialog/dialog.service';
import * as lodash from 'lodash';

export interface IOptions {
  titleParams?: object;
  positiveParams?: object;
  negativeParams?: object;
  disableClose?: boolean;
  dialogClass?: string;
  maxLength?: number;
  mandatory?: boolean;
  defaultValue?: string;
}

@Injectable()
export class McitEditTextAreaModalService {
  constructor(private dialog: McitDialog) {}

  editTextArea(titleKey: string, informationTextKey: string, positiveKey: string, negativeKey: string, options?: IOptions): Observable<{ value: string }> {
    const ref = this.dialog.open<McitEditTextAreaModalComponent, any, { value: string }>(McitEditTextAreaModalComponent, {
      dialogClass: lodash.get(options, 'dialogClass', 'modal-dialog-centered'),
      disableClose: lodash.get(options, 'disableClose', false),
      data: {
        title: titleKey,
        informationText: informationTextKey,
        positiveKey,
        negativeKey,
        options
      }
    });
    return ref.afterClosed();
  }
}
