import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { PlannerTask, PlannerTaskRow } from '../../../sprint/models/sprint.models';

@Component({
  selector: 'app-task-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './task-detail.modal.html',
  styleUrl: './task-detail.modal.scss',
})
export class TaskDetailModalComponent implements OnInit {
  private readonly modalController = inject(ModalController);

  @Input({ required: true }) task!: PlannerTaskRow;

  draft: PlannerTask = createTaskTemplate();
  checklistInput = '';

  ngOnInit(): void {
    this.draft = structuredClone(this.task.item_json);
  }

  cancel(): void {
    void this.modalController.dismiss(null, 'cancel');
  }

  save(): void {
    void this.modalController.dismiss(
      {
        item_json: this.draft,
      },
      'save'
    );
  }

  complete(): void {
    void this.modalController.dismiss(
      {
        actual_min: this.draft.actual_min ?? this.draft.estimate_min,
      },
      'complete'
    );
  }

  addChecklistItem(): void {
    const label = this.checklistInput.trim();
    if (!label) {
      return;
    }

    this.draft = {
      ...this.draft,
      checklist: [
        ...this.draft.checklist,
        { id: `c${Date.now()}`, label, done: false },
      ],
    };
    this.checklistInput = '';
  }

  removeChecklistItem(itemId: string): void {
    this.draft = {
      ...this.draft,
      checklist: this.draft.checklist.filter((item) => item.id !== itemId),
    };
  }
}

function createTaskTemplate(): PlannerTask {
  return {
    schema_version: 1,
    lane: 'lesson',
    title: 'Task',
    priority: 'P2',
    status: 'todo',
    estimate_min: 30,
    actual_min: null,
    tags: [],
    checklist: [],
    note: '',
    links: [],
    capture_on_done: {
      create_capture_note: true,
      template: 'What did I learn? What confused me? One next step.',
    },
  };
}
