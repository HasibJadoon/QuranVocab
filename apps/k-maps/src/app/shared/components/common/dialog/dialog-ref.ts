import { OverlayRef } from '@angular/cdk/overlay';
import { Observable, Subject, Subscription } from 'rxjs';
import { McitDialogContainerComponent } from './dialog-container.component';
import { McitDialogConfig } from './dialog-config';
import { filter, take } from 'rxjs/operators';

export class McitDialogRef<T, R = any> {
  componentInstance: T;

  private readonly afterOpenedSubject = new Subject<R | undefined>();
  private readonly afterClosedSubject = new Subject<R | undefined>();
  private result: R | undefined;
  private subscriptions: Subscription[] = [];

  constructor(private overlayRef: OverlayRef, private dialogContainer: McitDialogContainerComponent, private config: McitDialogConfig<any>) {
    this.subscriptions.push(
      dialogContainer.animationStateChanged
        .pipe(
          filter((event) => event.phaseName === 'done' && event.toState === 'enter'),
          take(1)
        )
        .subscribe(() => {
          this.afterOpenedSubject.next();
          this.afterOpenedSubject.complete();
        })
    );

    this.subscriptions.push(
      dialogContainer.animationStateChanged
        .pipe(
          filter((event) => event.phaseName === 'done' && event.toState === 'exit'),
          take(1)
        )
        .subscribe(() => this.overlayRef.dispose())
    );

    this.subscriptions.push(
      dialogContainer.backdropEvents().subscribe(() => {
        if (!config.disableClose) {
          this.close();
        }
      })
    );
    this.subscriptions.push(
      dialogContainer.escEvents().subscribe(() => {
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
    // this.overlayRef.dispose();
    this.dialogContainer.startExitAnimation();
  }

  afterOpened(): Observable<R | undefined> {
    return this.afterOpenedSubject.asObservable();
  }

  afterClosed(): Observable<R | undefined> {
    return this.afterClosedSubject.asObservable();
  }
}
