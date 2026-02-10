import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { QuranLessonTaskJsonComponent } from '../task-json/task-json.component';

@Component({
  selector: 'app-morphology-task',
  standalone: true,
  imports: [CommonModule, QuranLessonTaskJsonComponent],
  templateUrl: './morphology-task.component.html',
})
export class MorphologyTaskComponent {}
