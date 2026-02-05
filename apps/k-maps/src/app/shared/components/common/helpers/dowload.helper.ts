import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { doCatch } from '@lib-shared/common/helpers/error.helper';
import { McitPopupService } from '@lib-shared/common/services/popup.service';
import { McitWaitingService } from '@lib-shared/common/services/waiting.service';
import * as fs from 'file-saver';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, mergeMap, tap } from 'rxjs/operators';

export function checkArrayBufferAndDownload(
  arrayBuffer$: Observable<ArrayBuffer>,
  filename: string,
  failureFlag?: string,
  waitingService?: McitWaitingService,
  popupService?: McitPopupService,
  dialogRef?: McitDialogRef<any>,
  type = 'application/ms-excel'
): void {
  const failureFlagLength = failureFlag ? new TextEncoder().encode(failureFlag).length : undefined;
  waitingService?.showWaiting();
  arrayBuffer$
    .pipe(
      mergeMap((arrayBuffer) => forkJoin([failureFlagLength ? new Blob([arrayBuffer.slice(-failureFlagLength)]).text() : of(null), of(arrayBuffer)])),
      tap(([checkFailure, arrayBuffer]) => {
        if (failureFlagLength && checkFailure === failureFlag) {
          waitingService?.hideWaiting();
          popupService?.showError();
        } else {
          fs.saveAs(new Blob([arrayBuffer], { type: type }), filename);
          waitingService?.hideWaiting();
          dialogRef?.close();
        }
      }),
      catchError((err) => doCatch(`_checkArrayBufferAndDownload`, err, null, popupService, waitingService))
    )
    .subscribe();
}
