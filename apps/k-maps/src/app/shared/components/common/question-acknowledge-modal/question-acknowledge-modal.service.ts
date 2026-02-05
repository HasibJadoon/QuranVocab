import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../dialog/dialog.service';
import { IMcitQuestionOptions } from '../question-modal/question-modal.service';
import { McitQuestionAcknowledgeModalComponent } from './question-acknowledge-modal.component';

@Injectable()
export class McitQuestionAcknowledgeModalService {
  constructor(private dialog: McitDialog) {}

  showQuestion(titleKey: string, questionKey: string, positiveKey: string, negativeKey: string, danger: boolean = false, options?: IMcitQuestionOptions): Observable<{ result: boolean; checkbox: boolean }> {
    const ref = this.dialog.open<McitQuestionAcknowledgeModalComponent, any, { result: boolean; checkbox: boolean }>(McitQuestionAcknowledgeModalComponent, {
      dialogClass: options?.dialogClass ?? 'modal-lg modal-dialog-centered',
      disableClose: options ? options.disableClose : false,
      data: {
        title: titleKey,
        question: questionKey,
        negativeAction: negativeKey,
        positiveAction: positiveKey,
        danger,
        options
      }
    });
    return ref.afterClosed();
  }
}
