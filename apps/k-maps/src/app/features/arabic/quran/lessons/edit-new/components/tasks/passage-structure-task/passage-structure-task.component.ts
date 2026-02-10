import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { QuranLessonTaskJsonComponent } from '../task-json/task-json.component';

@Component({
  selector: 'app-passage-structure-task',
  standalone: true,
  imports: [CommonModule, QuranLessonTaskJsonComponent],
  templateUrl: './passage-structure-task.component.html',
})
export class PassageStructureTaskComponent {}
