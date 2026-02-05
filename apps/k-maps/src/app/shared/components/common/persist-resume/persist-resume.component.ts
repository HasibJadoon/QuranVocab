import { EventEmitter, Input, OnDestroy, OnInit, Output, AfterViewInit, Component, Renderer2 } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { map, tap, catchError, concatMap, takeUntil, delay, take } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { Attach64 } from '@lib-shared/common/models/attachments.model';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';
import { McitStorage } from '@lib-shared/common/storage/mcit-storage';
import { doCatch } from '@lib-shared/common/helpers/error.helper';

export interface IPersistResumeOptions {
  storageStateKey: string;
  component: { extractState: () => any };
}

export interface IResumeResult {
  hasResult: boolean;
  data?: {
    camera_state?: any;
    [key: string]: any;
  };
}

@TraceErrorClass()
@Component({
  selector: 'mcit-persist-resume',
  templateUrl: './persist-resume.component.html',
  styleUrls: ['./persist-resume.component.scss']
})
export class McitPersistResumeComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() options: IPersistResumeOptions;
  @Input() persistEvent$: Observable<void>;
  @Output() resumed = new EventEmitter<IResumeResult>();

  private destroy$: Subject<boolean> = new Subject();
  private listeners: Array<() => void> = [];

  constructor(private storage: McitStorage, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.listeners
      .push
      // this.renderer.listen(document, 'pause', (event) => this.persist()),
      // this.renderer.listen(document, 'resume', (event) => this.resume())
      ();

    this.persistEvent$
      ?.pipe(
        takeUntil(this.destroy$),
        tap(() => {
          this.persist();
        })
      )
      .subscribe();

    this.destroy$
      .pipe(
        delay(1000),
        take(1),
        concatMap(() => (this.options?.storageStateKey ? this.storage.remove(this.options.storageStateKey) : of(true)))
      )
      .subscribe();
  }

  ngAfterViewInit(): void {
    this.resume();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
    this.listeners.forEach((detach) => detach());
    if (this.options) {
      this.options.component = undefined;
    }
  }

  private resume(event?: any): void {
    this.getComponentState$()
      .pipe(
        tap((resumeState) => {
          if (event?.pendingResult?.pluginServiceName === 'Camera') {
            if (event.pendingResult.pluginStatus === 'OK') {
              const base64 = 'data:image/jpeg;base64,' + event.pendingResult.result;
              const newAttach: Attach64 = {
                base64,
                sync_id: uuid(),
                is_loaded: true
              };
              resumeState.data = {
                ...resumeState?.data,
                camera_state: newAttach
              };
            }
          }
          this.resumed.emit(
            resumeState.data
              ? resumeState
              : {
                  hasResult: false
                }
          );
        }),
        catchError((error) => doCatch('_onResume', error, null))
      )
      .subscribe();
  }

  private persist(): void {
    if (this.options) {
      const currentState = this.options.component?.extractState();
      if (currentState) {
        // console.log('save PauseState', JSON.stringify(currentState));
        this.storage
          .set(this.options.storageStateKey, currentState)
          .pipe(catchError((error) => doCatch('_onPause', error, null)))
          .subscribe();
      }
    }
  }

  private getComponentState$(): Observable<IResumeResult> {
    const resumeState: IResumeResult = {
      hasResult: true,
      data: {}
    };
    if (this.options?.storageStateKey) {
      return this.storage.get(this.options.storageStateKey).pipe(
        map((data) => {
          if (data) {
            return {
              hasResult: true,
              data: {
                [this.options.storageStateKey]: data
              }
            };
          }
          return {
            hasResult: false
          };
        })
      );
    } else {
      return of({
        hasResult: false
      });
    }
  }
}
