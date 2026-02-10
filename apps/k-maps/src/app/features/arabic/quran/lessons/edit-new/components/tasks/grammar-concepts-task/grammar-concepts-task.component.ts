import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { QuranLessonTaskJsonComponent } from '../task-json/task-json.component';

@Component({
  selector: 'app-grammar-concepts-task',
  standalone: true,
  imports: [CommonModule, QuranLessonTaskJsonComponent],
  templateUrl: './grammar-concepts-task.component.html',
})
export class GrammarConceptsTaskComponent {}
