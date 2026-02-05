import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-right-pane-outlet',
  standalone: true,
  imports: [CommonModule],
  template: `<aside class="context-pane"><ng-content /></aside>`,
})
export class RightPaneOutletComponent {}
