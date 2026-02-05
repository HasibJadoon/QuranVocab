import { Injectable } from '@angular/core';
import { McitDialog } from '@lib-shared/common/dialog/dialog.service';
import { Observable } from 'rxjs';
import { McitWorkerTaskExecutionsModalComponent } from './worker-task-executions-modal.component';
import { AbstractWorkerTaskExecutionsHttpService } from '@lib-shared/common/worker-task-execution/abstract-worker-task-executions-http.service';

@Injectable()
export class McitWorkerTaskExecutionsModalService {
  constructor(private dialog: McitDialog) {}

  showWorkerTaskExecutions(workerTaskExecutionsHttpService: AbstractWorkerTaskExecutionsHttpService, executionId: string): Observable<void> {
    const ref = this.dialog.open<
      McitWorkerTaskExecutionsModalComponent,
      {
        executionId: string;
        workerTaskExecutionsHttpService: AbstractWorkerTaskExecutionsHttpService;
      },
      void
    >(McitWorkerTaskExecutionsModalComponent, {
      dialogClass: 'modal-lg',
      disableClose: false,
      autoFocus: true,
      hasBackdrop: true,
      restoreFocus: true,
      data: {
        executionId,
        workerTaskExecutionsHttpService
      }
    });
    return ref.afterClosed();
  }
}
