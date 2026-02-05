import { Injectable } from '@angular/core';
import { McitQuestionModalComponent } from './question-modal.component';
import { Observable } from 'rxjs';
import { McitDialog } from '../dialog/dialog.service';

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
  extraParams1?: object;
  extraParams2?: object;
  hasBackdrop?: boolean;
  innerHtmlQuestion?: boolean;
  innerHtmlKey1?: boolean;
  innerHtmlKey2?: boolean;
  alertMessage?: string;
  alertMessageParams?: object;
}

@Injectable()
export class McitQuestionModalService {
  constructor(private dialog: McitDialog) {}

  showQuestion(titleKey: string, questionKey: string, positiveKey: string, negativeKey: string, danger: boolean = false, options?: IMcitQuestionOptions): Observable<boolean> {
    const ref = this.dialog.open<McitQuestionModalComponent, any, boolean>(McitQuestionModalComponent, {
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
