import { CommonModule } from '@angular/common';
import { Component, DoCheck, Input, inject } from '@angular/core';
import { QuranLessonEditorFacade } from '../../../facade/editor.facade';
import { TaskTab } from '../../../models/editor.types';
import { QuranLessonTaskJsonComponent } from '../task-json/task-json.component';

@Component({
  selector: 'app-expressions-task',
  standalone: true,
  imports: [CommonModule, QuranLessonTaskJsonComponent],
  templateUrl: './expressions-task.component.html',
})
export class ExpressionsTaskComponent implements DoCheck {
  private readonly facade = inject(QuranLessonEditorFacade);
  private seededTab: TaskTab | null = null;
  @Input() readOnly = false;

  ngDoCheck() {
    if (this.readOnly) return;
    this.ensureDefaultExpressionsJson();
  }

  private ensureDefaultExpressionsJson() {
    const tab = this.facade.state.taskTabs.find((entry) => entry.type === 'expressions') ?? null;
    if (!tab) return;
    if (this.seededTab === tab) return;

    const raw = (tab.json ?? '').trim();
    if (!this.isEmptyPayload(raw)) {
      this.seededTab = tab;
      return;
    }

    tab.json = JSON.stringify(
      [
        {
          id: 'EXP:Q12:6:TAWIL_AL_AHADITH',
          canonical_input: 'Q12:6|من تأويل الأحاديث',
          expression_ar: 'مِنْ تَأْوِيلِ الْأَحَادِيثِ',
          expression_norm: 'من تاويل الاحاديث',
          surah: 12,
          ayah: 6,
          category: 'hermeneutical_term',
          scholarly_status: 'highly_discussed',
          meta: {
            type: 'technical_theological_term',
            significance:
              'Taʾwīl denotes the unfolding or realization of hidden meaning; central to Surah Yusuf’s theology of dream fulfillment and providential history.',
            sources: [],
          },
        },
      ],
      null,
      2
    );
    this.seededTab = tab;
  }

  private isEmptyPayload(raw: string): boolean {
    if (!raw) return true;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.length === 0;
      if (parsed && typeof parsed === 'object') return Object.keys(parsed as Record<string, unknown>).length === 0;
      return false;
    } catch {
      return false;
    }
  }
}
