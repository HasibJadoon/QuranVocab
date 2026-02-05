import { Directive, OnDestroy, Self } from '@angular/core';
import { MatDatepicker } from '@angular/material/datepicker';
import { Subscription } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'mat-datepicker[autoTouchUi]'
})
export class McitAutoTouchUiDirective implements OnDestroy {
  private subscriptions: Subscription[] = [];

  constructor(@Self() private matDatePicker: MatDatepicker<any>, private breakpointObserver: BreakpointObserver) {
    this.subscriptions.push(this.breakpointObserver.observe('(max-width: 767px)').subscribe((next) => (this.matDatePicker.touchUi = next.matches)));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((data) => data.unsubscribe());
  }
}
