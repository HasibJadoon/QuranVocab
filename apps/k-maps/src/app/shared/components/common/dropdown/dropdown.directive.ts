import { Directive, ElementRef, HostListener, Input, OnDestroy, TemplateRef } from '@angular/core';
import { McitDropdown } from './dropdown.service';
import { McitDropdownConfig } from './dropdown-config';
import { McitDropdownRef } from './dropdown-ref';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[mcitDropdown]'
})
export class McitDropdownDirective<T, D> implements OnDestroy {
  @Input('mcitDropdown')
  template: TemplateRef<T>;

  @Input('mcitDropdownConfig')
  config: McitDropdownConfig<D>;

  private ref: McitDropdownRef<T>;
  private subscriptions: Subscription[] = [];

  constructor(private elementRef: ElementRef, private dropdown: McitDropdown) {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    if (this.ref) {
      this.ref.close();
      this.ref = null;
    }
  }

  @HostListener('click')
  onClick(): void {
    this.ref = this.dropdown.open<T, D, any>(this.template, this.elementRef, this.config);
    this.subscriptions.push(this.ref.afterClosed().subscribe(() => (this.ref = null)));
  }
}
