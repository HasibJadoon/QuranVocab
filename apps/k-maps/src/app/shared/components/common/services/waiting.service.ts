import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class McitWaitingService {
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
