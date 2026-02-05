import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../../../dialog/dialog.service';
import { McitChatMessagesMassModalComponent } from './chat-messages-mass-modal.component';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';

@TraceErrorClass()
@Injectable()
export class McitChatMessagesMassModalService {
  constructor(private dialog: McitDialog) {}

  showModal(isMRI: boolean): Observable<string> {
    return this.dialog
      .open(McitChatMessagesMassModalComponent, {
        dialogClass: 'modal-lg modal-dialog-centered',
        data: { isMRI }
      })
      .afterClosed();
  }
}
