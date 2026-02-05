import { NgControl } from '@angular/forms';
import { Directive, Input } from '@angular/core';

@Directive({
  selector: '[mcitDisableControlNoEvent]'
})
export class McitDisableControlNoEventDirective {
  @Input('mcitDisableControlNoEvent')
  set disableControl(condition: boolean) {
    const action = condition ? 'disable' : 'enable';
    // fix depuis Angular 9 apparemment, à voir pour faire qqchose de plus propre
    setTimeout(() => {
      this.ngControl.control[action]({ onlySelf: true, emitEvent: false });
    });
  }

  constructor(private ngControl: NgControl) {}
}
