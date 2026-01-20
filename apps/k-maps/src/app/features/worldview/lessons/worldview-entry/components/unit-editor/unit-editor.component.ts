import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvidenceEditorComponent } from '../evidence-editor/evidence-editor.component';

type Unit = {
  id: string;
  type: string;
  text: string;
  stance: string;
  evidence: Array<{ kind: string; ref: string; snippet: string }>;
  notes: string;
  concept_refs: string[];
};

@Component({
  selector: 'app-unit-editor',
  standalone: true,
  imports: [CommonModule, EvidenceEditorComponent],
  templateUrl: './unit-editor.component.html',
  styleUrls: ['./unit-editor.component.scss'],
})
export class UnitEditorComponent {
  @Input() unit!: Unit;
  @Output() linkConcept = new EventEmitter<void>();
}
