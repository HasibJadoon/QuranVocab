import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export enum ISyncStatus {
  in = 'in',
  out = 'out'
}

@Injectable({
  providedIn: 'root'
})
export class McitSyncLayoutService {
  private syncInfoSUbject = new BehaviorSubject<ISyncStatus>(null);

  constructor() {}

  syncInfo$(): Observable<ISyncStatus> {
    return this.syncInfoSUbject.asObservable();
  }

  updateSyncInfo(status: ISyncStatus): void {
    this.syncInfoSUbject.next(status);
  }
}
