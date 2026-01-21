import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { QuranLessonService } from '../../../../shared/services/quran-lesson.service';
import { QuranLesson } from '../../../../shared/models/quran-lesson.model';

@Component({
  selector: 'app-quran-lesson-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quran-lesson-editor.component.html',
  styleUrls: ['./quran-lesson-editor.component.scss']
})
export class QuranLessonEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(QuranLessonService);

  lesson: QuranLesson | null = null;
  textJson = '';

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!isNaN(id)) {
      this.service.getLesson(id).subscribe((lesson) => {
        this.lesson = lesson;
        this.textJson = JSON.stringify(lesson.text, null, 2);
      });
    }
  }

  save() {
    // placeholder: ideally POST/PUT to /arabic/literature/ar_lessons/quran/:id
    this.router.navigate(['../view'], { relativeTo: this.route });
  }
}
