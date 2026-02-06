import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-sentence-segmentation-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pane-head">
      <h3>Sentence Builder</h3>
      <button type="button" class="btn btn-primary btn-sm" (click)="add.emit()">Add Sentence</button>
    </div>
  `,
})
export class SentenceSegmentationCanvasComponent {
  @Output() add = new EventEmitter<void>();
}
