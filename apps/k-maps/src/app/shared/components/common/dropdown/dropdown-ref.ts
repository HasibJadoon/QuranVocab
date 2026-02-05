import { OverlayRef } from '@angular/cdk/overlay';
import { Observable, Subject, Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { McitDropdownConfig } from './dropdown-config';
import { McitDropdownContainerComponent } from './dropdown-container.component';

export class McitDropdownRef<T, R = any> {
  componentInstance: T;

  private readonly afterOpenedSubject = new Subject<R | undefined>();
  private readonly afterClosedSubject = new Subject<R | undefined>();
  private result: R | undefined;
  private subscriptions: Subscription[] = [];

  constructor(private overlayRef: OverlayRef, private dropdownContainer: McitDropdownContainerComponent, private config: McitDropdownConfig<any>) {
    this.subscriptions.push(
      dropdownContainer.animationStateChanged
        .pipe(
          filter((event) => event.phaseName === 'done' && event.toState.endsWith('_enter')),
          take(1)
        )
        .subscribe(() => {
          this.afterOpenedSubject.next();
          this.afterOpenedSubject.complete();
        })
    );

    this.subscriptions.push(
      dropdownContainer.animationStateChanged
        .pipe(
          filter((event) => event.phaseName === 'done' && event.toState.endsWith('_exit')),
          take(1)
        )
        .subscribe(() => this.overlayRef.dispose())
    );

    this.subscriptions.push(
      dropdownContainer.backdropEvents().subscribe(() => {
        if (!config.disableClose) {
          this.close();
        }
      })
    );
    this.subscriptions.push(
      dropdownContainer.escEvents().subscribe(() => {
        if (!config.disableClose) {
          this.close();
        }
      })
    );

    overlayRef.detachments().subscribe(() => {
      this.afterClosedSubject.next(this.result);
      this.afterClosedSubject.complete();
      this.componentInstance = null;

      this.subscriptions.forEach((s) => s.unsubscribe());
    });
  }

  close(result?: R | undefined): void {
    this.result = result;
    this.dropdownContainer.startExitAnimation();
  }

  afterOpened(): Observable<R | undefined> {
    return this.afterOpenedSubject.asObservable();
  }

  afterClosed(): Observable<R | undefined> {
    return this.afterClosedSubject.asObservable();
  }

  updatePosition(): void {
    this.overlayRef.updatePosition();
  }
}
