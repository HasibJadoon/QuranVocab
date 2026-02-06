import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-selection-summary-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="id-preview">
      <div>
        <p>Proposed container ID</p>
        <code>{{ containerId }}</code>
      </div>
      <div>
        <p>Proposed passage unit ID</p>
        <code>{{ passageUnitId }}</code>
      </div>
    </div>
  `,
})
export class SelectionSummaryCardComponent {
  @Input() containerId = '';
  @Input() passageUnitId = '';
}
