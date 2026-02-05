import { Component, Input } from '@angular/core';

@Component({
  selector: 'mcit-read-only-wrapper',
  styleUrls: ['read-only-wrapper.component.scss'],
  templateUrl: 'read-only-wrapper.component.html'
})
export class McitReadOnlyWrapperComponent {
  @Input()
  readonly isReadOnly: boolean;
  constructor() {}
}
