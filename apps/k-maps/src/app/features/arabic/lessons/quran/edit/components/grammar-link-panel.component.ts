import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

type GrammarTarget = {
  id: string;
  label: string;
};

@Component({
  selector: 'app-grammar-link-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pane-head">
      <h3>{{ title }}</h3>
    </div>

    <label>
      <span>Target</span>
      <select [ngModel]="selectedTargetId" (ngModelChange)="selectedTargetChange.emit($event)">
        <option value="">Select target</option>
        <option *ngFor="let target of targets" [value]="target.id">{{ target.label }}</option>
      </select>
    </label>

    <div *ngIf="selectedTargetId; else noTarget" class="grammar-links">
      <label>
        <span>Add grammar concept</span>
        <div class="grammar-add-row">
          <select [(ngModel)]="draftConcept">
            <option value="">Choose concept</option>
            <option *ngFor="let concept of grammarConcepts" [value]="concept">{{ concept }}</option>
          </select>
          <button type="button" class="btn btn-sm btn-primary" (click)="addDraft()">Add</button>
        </div>
      </label>

      <ul class="review-list" *ngIf="selectedLinks.length; else noLinks">
        <li *ngFor="let link of selectedLinks">
          <span class="status">GR</span>
          <div>
            <strong>{{ link }}</strong>
          </div>
          <button type="button" class="btn btn-sm btn-danger" (click)="remove.emit({ targetId: selectedTargetId, concept: link })">
            Remove
          </button>
        </li>
      </ul>

      <ng-template #noLinks>
        <p class="empty-state">No grammar links for selected target.</p>
      </ng-template>
    </div>

    <ng-template #noTarget>
      <p class="empty-state">Pick a target first.</p>
    </ng-template>
  `,
})
export class GrammarLinkPanelComponent {
  @Input() title = 'Grammar Links';
  @Input() targets: GrammarTarget[] = [];
  @Input() selectedTargetId = '';
  @Input() grammarConcepts: string[] = [];
  @Input() linkMap: Record<string, string[]> = {};

  @Output() selectedTargetChange = new EventEmitter<string>();
  @Output() add = new EventEmitter<{ targetId: string; concept: string }>();
  @Output() remove = new EventEmitter<{ targetId: string; concept: string }>();

  draftConcept = '';

  get selectedLinks() {
    if (!this.selectedTargetId) return [];
    return this.linkMap[this.selectedTargetId] ?? [];
  }

  addDraft() {
    const targetId = this.selectedTargetId;
    const concept = this.draftConcept.trim();
    if (!targetId || !concept) return;
    this.add.emit({ targetId, concept });
    this.draftConcept = '';
  }
}
