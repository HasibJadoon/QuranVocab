import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription, switchMap, of } from 'rxjs';

import { LessonSection } from '../../../../../../shared/models/arabic/lesson-section.model';
import { QuranLessonSectionsService } from '../../../../../../shared/services/quran-lesson-sections.service';

@Component({
  selector: 'app-quran-section-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quran-section-view.component.html',
  styleUrls: ['./quran-section-view.component.scss']
})
export class QuranSectionViewComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private sections = inject(QuranLessonSectionsService);
  section: LessonSection | undefined;
  private sub = new Subscription();

  ngOnInit() {
    const obs = this.route.paramMap.pipe(
      switchMap((params: ParamMap) => {
        const sectionId = params.get('sectionId');
        if (!sectionId) {
          return of(undefined);
        }
        return this.sections.get(sectionId);
      })
    );
    this.sub.add(
      obs.subscribe((section: LessonSection | undefined) => (this.section = section))
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
