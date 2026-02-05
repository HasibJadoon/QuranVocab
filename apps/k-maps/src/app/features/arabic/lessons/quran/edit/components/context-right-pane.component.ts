import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-context-right-pane',
  standalone: true,
  imports: [CommonModule],
  template: `<aside class="context-pane"><ng-content /></aside>`,
})
export class ContextRightPaneComponent {}
