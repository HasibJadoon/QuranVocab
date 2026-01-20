import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type Evidence = { kind: string; ref: string; snippet: string };

@Component({
  selector: 'app-evidence-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './evidence-editor.component.html',
  styleUrls: ['./evidence-editor.component.scss'],
})
export class EvidenceEditorComponent {
  @Input() evidence: Evidence[] = [];
}
