import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';

@TraceErrorClass()
@Injectable({
  providedIn: 'root'
})
export class McitChatWaitingService {
  private waitingSubject: Subject<boolean> = new BehaviorSubject<boolean>(false);

  constructor() {}

  waiting$(): Observable<boolean> {
    return this.waitingSubject.asObservable();
  }

  showWaiting(): void {
    this.waitingSubject.next(true);
  }

  hideWaiting(): void {
    this.waitingSubject.next(false);
  }
}
