import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { QuranLessonService } from '../../../../../shared/services/quran-lesson.service';
import { QuranLesson } from '../../../../../shared/models/arabic/quran-lesson.model';
import { QuranLessonToolbarComponent } from '../toolbar/quran-lesson-toolbar.component';

@Component({
  selector: 'app-quran-lesson-view',
  standalone: true,
  imports: [CommonModule, QuranLessonToolbarComponent],
  templateUrl: './quran-lesson-view.component.html',
  styleUrls: ['./quran-lesson-view.component.scss']
})
export class QuranLessonViewComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private service = inject(QuranLessonService);
  private subs = new Subscription();

  lesson: QuranLesson | null = null;

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!isNaN(id)) {
      const sub = this.service
        .getLesson(id)
        .subscribe({
        next: (lesson: QuranLesson) => (this.lesson = lesson),
          error: () => {
            this.lesson = null;
          }
        });
      this.subs.add(sub);
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
