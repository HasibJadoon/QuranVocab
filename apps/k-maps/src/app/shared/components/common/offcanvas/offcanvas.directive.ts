import { Directive, HostListener, Input, OnDestroy, TemplateRef } from '@angular/core';
import { McitOffcanvas } from './offcanvas.service';
import { McitOffcanvasRef } from './offcanvas-ref';
import { Subscription } from 'rxjs';
import { McitOffcanvasConfig } from './offcanvas-config';

@Directive({
  selector: '[mcitOffcanvas]'
})
export class McitOffcanvasDirective<T, D> implements OnDestroy {
  @Input('mcitOffcanvas')
  template: TemplateRef<T>;

  @Input('mcitOffcanvasConfig')
  config: McitOffcanvasConfig<D>;

  private ref: McitOffcanvasRef<T>;
  private subscriptions: Subscription[] = [];

  constructor(private offcanvas: McitOffcanvas) {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    if (this.ref) {
      this.ref.close();
      this.ref = null;
    }
  }

  @HostListener('click')
  onClick(): void {
    if (this.ref != null) {
      this.subscriptions.forEach((s) => s.unsubscribe());
      this.ref.close();
      this.ref = null;
    } else {
      this.ref = this.offcanvas.open<T, D, any>(this.template, this.config);
      this.subscriptions.push(this.ref.afterClosed().subscribe(() => (this.ref = null)));
    }
  }
}
