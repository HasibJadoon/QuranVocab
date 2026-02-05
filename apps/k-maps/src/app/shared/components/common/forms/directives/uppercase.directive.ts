import { Directive, HostBinding, HostListener, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: 'input[mcitUppercase]'
})
export class McitUppercaseDirective {
  @HostBinding('style.text-transform')
  style = 'uppercase';

  constructor(@Self() private control: NgControl) {}

  @HostListener('input', ['$event'])
  input($event): void {
    this.control.valueAccessor.writeValue($event.target.value.toUpperCase());
  }

  /*writeValue(value: any): void {
    if (value) {
      super.writeValue(value.toUpperCase());
    }
  }*/
}
