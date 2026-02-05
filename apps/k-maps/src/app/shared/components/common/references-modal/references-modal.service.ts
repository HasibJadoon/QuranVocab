import { Injectable } from '@angular/core';
import { McitReferencesModalComponent } from './references-modal.component';
import { McitDialog } from '../dialog/dialog.service';
import { Observable } from 'rxjs';

export interface IOptions {
  titleKey?: string;
  disableAutoCopy?: boolean;
}

@Injectable()
export class McitReferencesModalService {
  constructor(private dialog: McitDialog) {}

  showReferences(references: string[], options?: IOptions): Observable<void> {
    return this.dialog
      .open<McitReferencesModalComponent, { references: string[]; options?: IOptions }, void>(McitReferencesModalComponent, {
        dialogClass: 'modal-sm',
        data: {
          references,
          options
        }
      })
      .afterClosed();
  }
}
