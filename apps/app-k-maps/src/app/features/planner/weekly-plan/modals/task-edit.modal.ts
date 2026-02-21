import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { PlannerLane, PlannerPriority, PlannerTask } from '../../../sprint/models/sprint.models';

@Component({
  selector: 'app-task-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './task-edit.modal.html',
  styleUrl: './task-edit.modal.scss',
})
export class TaskEditModalComponent implements OnInit {
  private readonly modalController = inject(ModalController);

  @Input() initialTask: PlannerTask | null = null;
  @Input() relatedType: string | null = null;
  @Input() relatedId: string | null = null;

  readonly lanes: PlannerLane[] = ['lesson', 'podcast', 'notes', 'admin'];
  readonly priorities: PlannerPriority[] = ['P1', 'P2', 'P3'];

  draft: PlannerTask = createTaskTemplate();
  draftRelatedType = '';
  draftRelatedId = '';

  ngOnInit(): void {
    if (this.initialTask) {
      this.draft = structuredClone(this.initialTask);
    }
    this.draftRelatedType = this.relatedType ?? '';
    this.draftRelatedId = this.relatedId ?? '';
  }

  cancel(): void {
    void this.modalController.dismiss(null, 'cancel');
  }

  save(): void {
    this.draft.title = this.draft.title.trim() || 'Untitled task';
    void this.modalController.dismiss(
      {
        item_json: this.draft,
        related_type: this.draftRelatedType.trim() || null,
        related_id: this.draftRelatedId.trim() || null,
      },
      'save'
    );
  }
}

function createTaskTemplate(): PlannerTask {
  return {
    schema_version: 1,
    lane: 'lesson',
    title: 'New task',
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
    order_index: Date.now(),
  };
}
