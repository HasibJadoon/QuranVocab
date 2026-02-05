import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export enum CloseAction {
  DO_AND_CLOSE = 'DO AND CLOSE',
  OPEN_MODAL = 'OPEN MODAL',
  REDIRECT = 'REDIRECT'
}

@Injectable({
  providedIn: 'root'
})
export class CloseActionService {
  private closeAction: Subject<CloseAction> = new Subject<CloseAction>();
  private showHide: Subject<boolean> = new Subject<boolean>();
  private colorBtnPrimary: Subject<boolean> = new Subject<boolean>();

  constructor() {}

  closeAction$(): Observable<CloseAction> {
    return this.closeAction.asObservable();
  }

  showHideAction$(): Observable<boolean> {
    return this.showHide.asObservable();
  }

  colorBtnAction$(): Observable<boolean> {
    return this.colorBtnPrimary.asObservable();
  }

  close(): void {
    this.closeAction.next(CloseAction.REDIRECT);
  }

  action(action: CloseAction): void {
    this.closeAction.next(action);
  }

  hide() {
    this.showHide.next(false);
  }

  show() {
    this.showHide.next(true);
  }

  colorButtonPrimary() {
    this.colorBtnPrimary.next(true);
  }

  colorButtonDisabled() {
    this.colorBtnPrimary.next(false);
  }
}
