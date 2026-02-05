import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../dialog/dialog.service';
import { McitQuestionDiscardModalComponent } from './question-discard-modal.component';
import { IMcitQuestionDiscardOptions } from './question-discard.model';

@Injectable()
export class McitQuestionDiscardModalService {
  constructor(private dialog: McitDialog) {}

  showQuestion(titleKey: string, questionKey: string, saveKey: string, discardKey: string, cancelKey: string, danger: boolean = false, options?: IMcitQuestionDiscardOptions): Observable<string> {
    const ref = this.dialog.open<McitQuestionDiscardModalComponent, any, string>(McitQuestionDiscardModalComponent, {
      dialogClass: 'modal-lg modal-dialog-centered',
      disableClose: options ? options.disableClose : false,
      data: {
        title: titleKey,
        question: questionKey,
        discardAction: discardKey,
        saveAction: saveKey,
        cancelAction: cancelKey,
        danger,
        options
      }
    });
    return ref.afterClosed();
  }
}
