import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AppJsonEditorModalComponent } from '../../../../../../../../shared/components';
import { QuranLessonEditorFacade } from '../../../facade/editor.facade';
import { EditorState, TaskTab } from '../../../models/editor.types';
import { QuranLessonTaskJsonComponent } from '../task-json/task-json.component';

@Component({
  selector: 'app-expressions-task',
  standalone: true,
  imports: [CommonModule, QuranLessonTaskJsonComponent, AppJsonEditorModalComponent],
  templateUrl: './expressions-task.component.html',
})
export class ExpressionsTaskComponent {
  private readonly facade = inject(QuranLessonEditorFacade);

  insertModalOpen = false;
  insertModalJson = '';
  insertModalError = '';
  readonly insertModalTitle = 'Insert Expressions JSON List';
  readonly insertModalPlaceholder = JSON.stringify(
    {
      u_expressions: [
        {
          canonical_input: 'EXP|احسن القصص|',
          label: 'أَحْسَنَ الْقَصَصِ',
          text_ar: 'أَحْسَنَ الْقَصَصِ',
          sequence: ['أَحْسَنَ', 'الْقَصَصِ'],
          meta_json: {
            verse: '12:3',
            surah: 12,
            ayah: 3,
            significance:
              'Declares Surah Yusuf as a divinely structured, unified narrative; signals literary and theological superiority of the Qur’anic telling.',
            references: [
              'Mustansir Mir, Coherence in the Qur’an',
              'Neal Robinson, Discovering the Qur’an',
              'Nicolai Sinai, Key Terms of the Qur’an (q-ṣ-ṣ)',
            ],
          },
        },
        {
          canonical_input: 'EXP|من تأويل الاحاديث|',
          label: 'مِنْ تَأْوِيلِ الْأَحَادِيثِ',
          text_ar: 'مِنْ تَأْوِيلِ الْأَحَادِيثِ',
          sequence: ['مِنْ', 'تَأْوِيلِ', 'الْأَحَادِيثِ'],
          meta_json: {
            verse: '12:6',
            surah: 12,
            ayah: 6,
            significance:
              'Taʾwīl as unfolding or realization of hidden meaning; central to the theology of dream-fulfillment and divine plan in Surah Yusuf.',
            references: [
              'Nicolai Sinai, Key Terms of the Qur’an (taʾwīl)',
              'Toshihiko Izutsu, God and Man in the Qur’an',
              'al-Ṭabarī, Tafsīr (discussion of taʾwīl)',
            ],
          },
        },
        {
          canonical_input: 'EXP|يجتبيك ربك|',
          label: 'يَجْتَبِيكَ رَبُّكَ',
          text_ar: 'يَجْتَبِيكَ رَبُّكَ',
          sequence: ['يَجْتَبِيكَ', 'رَبُّكَ'],
          meta_json: {
            verse: '12:6',
            surah: 12,
            ayah: 6,
            significance: 'Technical election vocabulary implying intimate divine selection and prophetic destiny.',
            references: [
              'Nicolai Sinai, Key Terms of the Qur’an (j-b-y)',
              'Toshihiko Izutsu, God and Man in the Qur’an',
            ],
          },
        },
        {
          canonical_input: 'EXP|ان الشيطان للانسان عدو مبين|',
          label: 'إِنَّ الشَّيْطَانَ لِلْإِنسَانِ عَدُوٌّ مُبِينٌ',
          text_ar: 'إِنَّ الشَّيْطَانَ لِلْإِنسَانِ عَدُوٌّ مُبِينٌ',
          sequence: ['إِنَّ', 'الشَّيْطَانَ', 'لِلْإِنسَانِ', 'عَدُوٌّ', 'مُبِينٌ'],
          meta_json: {
            verse: '12:5',
            surah: 12,
            ayah: 5,
            significance:
              'Establishes structural anthropological conflict; signals inherent enmity between Satan and humanity.',
            references: [
              'Toshihiko Izutsu, God and Man in the Qur’an',
              'Nicolai Sinai, Key Terms of the Qur’an (ʿaduww)',
            ],
          },
        },
        {
          canonical_input: 'EXP|انزلناه قرانا عربيا|',
          label: 'أَنْزَلْنَاهُ قُرْآنًا عَرَبِيًّا',
          text_ar: 'أَنْزَلْنَاهُ قُرْآنًا عَرَبِيًّا',
          sequence: ['أَنْزَلْنَاهُ', 'قُرْآنًا', 'عَرَبِيًّا'],
          meta_json: {
            verse: '12:2',
            surah: 12,
            ayah: 2,
            significance: 'Core revelation formula emphasizing divine descent and Arabic embodiment of revelation.',
            references: [
              'Nicolai Sinai, Key Terms of the Qur’an (n-z-l; qurʾān)',
              'Angelika Neuwirth, Studien zur Komposition der mekkanischen Suren',
              'M.A.S. Abdel Haleem, Understanding the Qur’an',
            ],
          },
        },
      ],
    },
    null,
    2
  );

  get state(): EditorState {
    return this.facade.state;
  }

  get tab(): TaskTab | null {
    return this.state.taskTabs.find((entry) => entry.type === 'expressions') ?? null;
  }

  get uExpressionCount(): number {
    return this.readRecordArray('u_expressions').length;
  }

  openInsertModal(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.insertModalError = '';
    this.insertModalJson = '';
    this.insertModalOpen = true;
  }

  closeInsertModal() {
    this.insertModalOpen = false;
    this.insertModalJson = '';
    this.insertModalError = '';
  }

  onInsertSave(draft: string) {
    this.insertModalJson = draft;
    this.applyInsertDraft();
  }

  saveTask() {
    this.facade.saveTask('expressions');
  }

  private applyInsertDraft() {
    let parsed: unknown;
    const trimmed = this.insertModalJson.trim();
    try {
      parsed = trimmed ? JSON.parse(trimmed) : {};
    } catch (err: any) {
      this.insertModalError = err?.message ?? 'Invalid JSON.';
      return;
    }

    let uExpressions: Array<Record<string, unknown>> = [];
    if (Array.isArray(parsed)) {
      uExpressions = this.asRecordArray(parsed);
    } else if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>;
      const hasUExpressionsKey = Object.prototype.hasOwnProperty.call(record, 'u_expressions');
      const hasOccExpressionsKey = Object.prototype.hasOwnProperty.call(record, 'occ_expressions');
      uExpressions = this.asRecordArray(record['u_expressions']);

      if (!uExpressions.length && (hasUExpressionsKey || hasOccExpressionsKey)) {
        this.insertModalError = 'Provide u_expressions[] only. occ_expressions is no longer supported.';
        return;
      }

      if (!uExpressions.length) {
        uExpressions = [record];
      }
    } else {
      this.insertModalError = 'JSON must be an object or array.';
      return;
    }

    if (!uExpressions.length) {
      this.insertModalError = 'No valid rows found. Provide u_expressions[].';
      return;
    }

    const payload = this.parseTaskPayload();
    const currentU = this.readRecordArrayFromPayload(payload, 'u_expressions');

    payload['u_expressions'] = [...currentU, ...uExpressions];
    this.writeTaskPayload(payload);
    this.closeInsertModal();
  }

  private parseTaskPayload(): Record<string, unknown> {
    const tab = this.tab;
    if (!tab) return {};
    try {
      const parsed = JSON.parse(tab.json || '{}');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return {};
    } catch {
      return {};
    }
  }

  private readRecordArray(key: 'u_expressions'): Array<Record<string, unknown>> {
    const payload = this.parseTaskPayload();
    return this.readRecordArrayFromPayload(payload, key);
  }

  private readRecordArrayFromPayload(
    payload: Record<string, unknown>,
    key: 'u_expressions'
  ): Array<Record<string, unknown>> {
    const list = Array.isArray(payload[key]) ? payload[key] : [];
    return list.filter((item: unknown) => item && typeof item === 'object') as Array<Record<string, unknown>>;
  }

  private asRecordArray(value: unknown): Array<Record<string, unknown>> {
    if (!Array.isArray(value)) return [];
    return value.filter((item: unknown) => item && typeof item === 'object') as Array<Record<string, unknown>>;
  }

  private writeTaskPayload(payload: Record<string, unknown>) {
    const tab = this.tab;
    if (!tab) return;
    payload['schema_version'] = payload['schema_version'] ?? 1;
    payload['task_type'] = 'expressions';
    payload['surah'] = this.state.selectedSurah ?? payload['surah'];
    payload['ayah_from'] = this.state.rangeStart ?? payload['ayah_from'];
    payload['ayah_to'] = this.state.rangeEnd ?? this.state.rangeStart ?? payload['ayah_to'];
    tab.json = JSON.stringify(payload, null, 2);
  }
}
