import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-quran-lesson-toolbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './quran-lesson-toolbar.component.html',
  styleUrls: ['./quran-lesson-toolbar.component.scss']
})
export class QuranLessonToolbarComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  navigate(action: 'view' | 'study' | 'edit') {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.router.navigate([`/arabic/quran/lessons/${id}/${action}`]);
  }
}
