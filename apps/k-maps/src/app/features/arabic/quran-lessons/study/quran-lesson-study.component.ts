import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { QuranLessonService } from '../../../../shared/services/quran-lesson.service';
import { QuranLesson } from '../../../../shared/models/quran-lesson.model';

@Component({
  selector: 'app-quran-lesson-study',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quran-lesson-study.component.html',
  styleUrls: ['./quran-lesson-study.component.scss']
})
export class QuranLessonStudyComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private service = inject(QuranLessonService);
  private subs = new Subscription();

  lesson: QuranLesson | null = null;

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!isNaN(id)) {
      this.subs.add(
        this.service.getLesson(id).subscribe({
          next: (lesson) => (this.lesson = lesson),
          error: () => (this.lesson = null)
        })
      );
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
