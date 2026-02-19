import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { QuranLessonTaskJsonComponent } from '../task-json/task-json.component';

@Component({
  selector: 'app-comprehension-task',
  standalone: true,
  imports: [CommonModule, QuranLessonTaskJsonComponent],
  templateUrl: './comprehension-task.component.html',
})
export class ComprehensionTaskComponent {
  @Input() readOnly = false;
}
