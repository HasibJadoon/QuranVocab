import { Directive, HostBinding, Input, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[formControlName],[formControl],[ngModel]'
})
export class McitControlStatusDirective {
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('control-active')
  controlActive = false;

  constructor(@Self() private control: NgControl) {}

  @HostBinding('class.is-valid')
  get ngClassValid(): boolean {
    if (this.control.control == null) {
      return false;
    }
    return this.controlActive && this.control.control.valid;
  }

  @HostBinding('class.is-invalid')
  get ngClassInvalid(): boolean {
    if (this.control.control == null) {
      return false;
    }
    return this.controlActive && this.control.control.invalid;
  }
}
