import { OverlayRef } from '@angular/cdk/overlay';
import { Observable, Subject, Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { McitOffcanvasConfig } from './offcanvas-config';
import { McitOffcanvasContainerComponent } from './offcanvas-container.component';

export class McitOffcanvasRef<T, R = any> {
  componentInstance: T;

  private readonly afterOpenedSubject = new Subject<R | undefined>();
  private readonly afterClosedSubject = new Subject<R | undefined>();
  private result: R | undefined;
  private subscriptions: Subscription[] = [];

  constructor(private overlayRef: OverlayRef, private offcanvasContainer: McitOffcanvasContainerComponent, private config: McitOffcanvasConfig<any>) {
    this.subscriptions.push(
      offcanvasContainer.animationStateChanged
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
      offcanvasContainer.animationStateChanged
        .pipe(
          filter((event) => event.phaseName === 'done' && event.toState.endsWith('_exit')),
          take(1)
        )
        .subscribe(() => this.overlayRef.dispose())
    );

    this.subscriptions.push(
      offcanvasContainer.backdropEvents().subscribe(() => {
        if (!config.disableClose) {
          this.close();
        }
      })
    );
    this.subscriptions.push(
      offcanvasContainer.escEvents().subscribe(() => {
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
    this.offcanvasContainer.startExitAnimation();
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
