import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../dialog/dialog.service';
import { McitQuestionModalApprovalComponent } from './question-model-approval.component';

export interface IMcitQuestionOptions {
  titleParams?: object;
  questionParams?: object;
  positiveParams?: object;
  negativeParams?: object;
  disableClose?: boolean;
  dialogClass?: string;
  acknowledgeKey?: string;
  extraKey1?: string;
  extraKey2?: string;
  agreeWarningMessage?;
  hasBackdrop?: boolean;
}

@Injectable()
export class McitQuestionApprovalModalService {
  constructor(private dialog: McitDialog) {}

  showQuestion(titleKey: string, questionKey: string, positiveKey: string, negativeKey: string, danger: boolean = false, options?: IMcitQuestionOptions): Observable<boolean | undefined> {
    const ref = this.dialog.open<McitQuestionModalApprovalComponent, any, boolean>(McitQuestionModalApprovalComponent, {
      dialogClass: options?.dialogClass ?? 'modal-lg modal-dialog-centered',
      disableClose: options?.disableClose ?? false,
      hasBackdrop: options?.hasBackdrop,
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
