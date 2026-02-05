import { Injectable } from '@angular/core';
import { IMultipleVinsModalOptions, IReferenceTypes, McitMultipleVinsModalComponent } from './multiple-vins-modal.component';
import { McitDialog } from '../dialog/dialog.service';
import { Observable } from 'rxjs';

@Injectable()
export class McitMultipleVinsModalService {
  constructor(private dialog: McitDialog) {}

  showMultipleVins(options?: IMultipleVinsModalOptions): Observable<string[]> {
    return this.dialog
      .open(McitMultipleVinsModalComponent, {
        dialogClass: 'modal-md',
        data: {
          options
        }
      })
      .afterClosed();
  }
}
