import { Component, Inject, OnInit } from '@angular/core';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '@lib-shared/common/dialog/dialog.service';
import { McitPopupService } from '@lib-shared/common/services/popup.service';
import { McitWaitingService } from '@lib-shared/common/services/waiting.service';
import { Observable } from 'rxjs/internal/Observable';
import { catchError, concatMap, distinctUntilChanged, filter, map, mergeMap, switchMap, tap, toArray } from 'rxjs/operators';
import { from, merge, of, Subject, timer } from 'rxjs';
import { ISearchModel } from '@lib-shared/common/search/search-model';
import { PER_PAGES } from '@lib-shared/common/helpers/pagination.helper';
import * as lodash from 'lodash';
import { FilterType, ISearchOptions } from '@lib-shared/common/search/search-options';
import { McitQuestionModalService } from '@lib-shared/common/question-modal/question-modal.service';
import { TasksInfoControllerService } from '@business-fvl/services/tasks-info-controller.service';
import { WorkerTaskExecutionStatus } from '@lib-shared/common/worker-task-execution/worker-task-execution-status.domain';
import { IWorkerTaskExecution } from '@lib-shared/common/worker-task-execution/worker-task-execution.model';
import { AbstractWorkerTaskExecutionsHttpService } from '@lib-shared/common/worker-task-execution/abstract-worker-task-executions-http.service';

@Component({
  selector: 'mcit-worker-task-executions-modal',
  templateUrl: './worker-task-executions-modal.component.html',
  styleUrls: ['./worker-task-executions-modal.component.scss']
})
export class McitWorkerTaskExecutionsModalComponent implements OnInit {
  waiting = false;

  total: number;
  totalPages: number;
  per_page: number;
  page: number;

  searchBox: ISearchModel = null;
  querySubject = new Subject<ISearchModel>();

  searchOptions: ISearchOptions = {
    size: 'small',
    filters: {
      filtersConfig: {
        hide_concurrency_worker: {
          type: FilterType.RADIO_LIST,
          nameKey: 'WORKER_TASK_EXECUTION.MODAL.FILTERS.HIDE_CONCURRENCY_WORKER',
          radioList: {
            values: [
              { code: 'true', nameKey: 'COMMON.YES' },
              { code: 'false', nameKey: 'COMMON.NO' }
            ]
          },
          defaultValue: 'true'
        },
        status: {
          type: FilterType.CHECK_LIST,
          nameKey: 'WORKER_TASK_EXECUTION.MODAL.FILTERS.STATUS',
          checkList: {
            values: Object.values(WorkerTaskExecutionStatus).map((k) => ({
              code: k,
              nameKey: 'WORKER_TASK_EXECUTION_STATUS.' + k
            })),
            result: 'string'
          }
        }
      }
    }
  };

  workerTaskExecutions$: Observable<IWorkerTaskExecution[]>;

  private executionId: string;

  private refreshSubject: Subject<boolean> = new Subject<boolean>();
  private paginationSubject = new Subject<{ page: number; per_page: number }>();

  constructor(
    private dialogRef: McitDialogRef<McitWorkerTaskExecutionsModalComponent, void>,
    @Inject(MCIT_DIALOG_DATA)
    public data: { executionId: string; workerTaskExecutionsHttpService: AbstractWorkerTaskExecutionsHttpService },
    private popupService: McitPopupService,
    private waitingService: McitWaitingService,
    private questionModalService: McitQuestionModalService,
    private tasksControllerService: TasksInfoControllerService
  ) {
    this.executionId = data.executionId;
  }

  ngOnInit(): void {
    this.page = 1;
    this.per_page = 10;

    this.searchBox = { text: '', filters: { hide_concurrency_worker: 'true' } };

    this.workerTaskExecutions$ = merge(
      timer(0, 10000),
      this.querySubject.asObservable().pipe(tap(() => (this.page = 1))),
      this.paginationSubject.asObservable().pipe(
        map((p) => ({
          page: p.page < 1 ? 1 : p.page,
          per_page: PER_PAGES.indexOf(p.per_page) ? p.per_page : 10
        })),
        distinctUntilChanged(),
        tap((p) => {
          this.page = p.page;
          this.per_page = p.per_page;
        })
      ),
      this.refreshSubject.asObservable().pipe(filter((elem) => elem))
    ).pipe(
      tap(() => (this.waiting = true)),
      switchMap(() => {
        const text = lodash.get(this.searchBox, 'text', '');
        const filters = lodash.get(this.searchBox, 'filters', {}) as any;

        return this.data.workerTaskExecutionsHttpService
          .search(
            text.length < 3 ? '' : text,
            this.page,
            this.per_page,
            {
              ...lodash.omitBy(filters, lodash.isNil),
              execution_id: this.executionId
            },
            '-created_date',
            ''
          )
          .pipe(
            tap((res) => {
              this.total = Number(res.headers.get('X-Total'));
              this.totalPages = Number(res.headers.get('X-Total-Pages'));
            }),
            map((res) => res.body),
            catchError((err) => {
              this.popupService.showError();
              return of([]);
            })
          );
      }),
      tap(() => (this.waiting = false))
    );
  }

  trackByWorkerTaskExecution(index: number, item: IWorkerTaskExecution): string {
    return item._id;
  }

  doClose(): void {
    this.dialogRef.close();
  }

  doPage(page: number): void {
    this.paginationSubject.next({ page, per_page: this.per_page });
  }

  doPerPage(per_page: number): void {
    this.paginationSubject.next({ page: 1, per_page });
  }

  doRecycle(workerTaskExecution: IWorkerTaskExecution): void {
    this.waitingService.showWaiting();

    this.data.workerTaskExecutionsHttpService.recycle(workerTaskExecution._id).subscribe(
      () => {
        this.waitingService.hideWaiting();

        this.popupService.showSuccess('WORKER_TASK_EXECUTION.MODAL.ASK_RECYCLE');

        this.refreshSubject.next(true);
        this.tasksControllerService.refresh();
      },
      () => {
        this.waitingService.hideWaiting();

        this.popupService.showError();
      }
    );
  }

  doRecycles(all = false): void {
    this.waitingService.showWaiting();

    const text = lodash.get(this.searchBox, 'text', '');
    const filters = lodash.get(this.searchBox, 'filters', {}) as any;

    this.data.workerTaskExecutionsHttpService
      .getAll(
        text.length < 3 ? '' : text,
        {
          ...lodash.omitBy(filters, lodash.isNil),
          execution_id: this.executionId,
          status: all ? 'TOD,CUR,ERR' : 'ERR'
        },
        '-created_date',
        '_id'
      )
      .pipe(
        concatMap((res) =>
          from(res).pipe(
            mergeMap(
              (w) =>
                this.data.workerTaskExecutionsHttpService.recycle(w._id).pipe(
                  map(() => true),
                  catchError(() => of(false))
                ),
              10
            ),
            toArray()
          )
        )
      )
      .subscribe((res) => {
        this.waitingService.hideWaiting();

        if (res.some((r) => !r)) {
          this.popupService.showError();
        } else if (res.length === 0) {
          this.popupService.showSuccess('WORKER_TASK_EXECUTION.MODAL.NO_EXECUTION_RECYCLE');
        } else {
          this.popupService.showSuccess('WORKER_TASK_EXECUTION.MODAL.ASK_RECYCLE');
        }

        this.refreshSubject.next(true);
        this.tasksControllerService.refresh();
      });
  }

  doDeletes(all = false): void {
    this.questionModalService
      .showQuestion(
        all ? 'WORKER_TASK_EXECUTION.MODAL.DELETE_ALL_QUESTION_TITLE' : 'WORKER_TASK_EXECUTION.MODAL.DELETE_ERRORS_QUESTION_TITLE',
        all ? 'WORKER_TASK_EXECUTION.MODAL.DELETE_ALL_QUESTION' : 'WORKER_TASK_EXECUTION.MODAL.DELETE_ERRORS_QUESTION',
        'COMMON.DELETE',
        'COMMON.CANCEL',
        true
      )
      .pipe(
        filter((res) => res),
        tap(() => this.waitingService.showWaiting()),
        concatMap(() => {
          const text = lodash.get(this.searchBox, 'text', '');
          const filters = lodash.get(this.searchBox, 'filters', {}) as any;

          return this.data.workerTaskExecutionsHttpService
            .getAll(
              text.length < 3 ? '' : text,
              {
                ...lodash.omitBy(filters, lodash.isNil),
                status: all ? 'TOD,CUR,ERR' : 'ERR',
                execution_id: this.executionId
              },
              '-created_date',
              '_id'
            )
            .pipe(
              concatMap((res) =>
                from(res).pipe(
                  mergeMap(
                    (w) =>
                      this.data.workerTaskExecutionsHttpService.delete(w._id).pipe(
                        map(() => true),
                        catchError(() => of(false))
                      ),
                    10
                  ),
                  toArray()
                )
              )
            );
        }),
        tap(() => this.waitingService.hideWaiting())
      )
      .subscribe((res) => {
        if (res.some((r) => !r)) {
          this.popupService.showError();
        } else if (res.length === 0) {
          this.popupService.showSuccess('WORKER_TASK_EXECUTION.MODAL.NO_EXECUTION_DELETE');
        } else {
          if (all) {
            this.popupService.showSuccess('WORKER_TASK_EXECUTION.MODAL.DELETE_ALL_SUCCESS');
          } else {
            this.popupService.showSuccess('WORKER_TASK_EXECUTION.MODAL.DELETE_ERRORS_SUCCESS');
          }
        }

        this.refreshSubject.next(true);
        this.tasksControllerService.refresh();
      });
  }
}
