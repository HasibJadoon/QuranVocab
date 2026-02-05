import { Directive, HostListener, Input, OnDestroy, TemplateRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { McitDialogConfig } from './dialog-config';
import { McitDialog } from './dialog.service';
import { McitDialogRef } from './dialog-ref';

@Directive({
  selector: '[mcitDialog]'
})
export class McitDialogDirective<T, D> implements OnDestroy {
  @Input('mcitDialog')
  template: TemplateRef<T>;

  @Input('mcitDialogConfig')
  config: McitDialogConfig<D>;

  private ref: McitDialogRef<T>;
  private subscriptions: Subscription[] = [];

  constructor(private dialog: McitDialog) {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    if (this.ref) {
      this.ref.close();
      this.ref = null;
    }
  }

  @HostListener('click')
  onClick(): void {
    this.ref = this.dialog.open<T, D, any>(this.template, this.config);
    this.subscriptions.push(this.ref.afterClosed().subscribe(() => (this.ref = null)));
  }
}
