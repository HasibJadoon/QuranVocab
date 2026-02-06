import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-center-workspace-outlet',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="main-pane"><ng-content /></div>`,
})
export class CenterWorkspaceOutletComponent {}
