import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppTabsComponent, type AppTabItem } from '../../../../../../../../shared/components';
import { QuranLessonEditorFacade } from '../../../facade/editor.facade';
import { EditorState, TaskTab } from '../../../models/editor.types';
import { QuranLessonTaskJsonComponent } from '../task-json/task-json.component';

@Component({
  selector: 'app-morphology-task',
  standalone: true,
  imports: [CommonModule, FormsModule, AppTabsComponent, QuranLessonTaskJsonComponent],
  templateUrl: './morphology-task.component.html',
})
export class MorphologyTaskComponent {
  private readonly facade = inject(QuranLessonEditorFacade);
  readonly tabs: AppTabItem[] = [
    { id: 'items', label: 'Word Items' },
    { id: 'json', label: 'Task JSON' },
  ];
  activeTabId: 'items' | 'json' = 'items';

  get state(): EditorState {
    return this.facade.state;
  }

  get tab(): TaskTab | null {
    return this.state.taskTabs.find((entry) => entry.type === 'morphology') ?? null;
  }

  get items(): Array<Record<string, unknown>> {
    const tab = this.tab;
    if (!tab) return [];
    try {
      const parsed = JSON.parse(tab.json || '{}');
      const list = Array.isArray(parsed?.items) ? parsed.items : [];
      return list.filter((item: unknown) => item && typeof item === 'object') as Array<Record<string, unknown>>;
    } catch {
      return [];
    }
  }

  onTabChange(tab: AppTabItem) {
    this.activeTabId = tab.id === 'json' ? 'json' : 'items';
  }

  loadFromVerses() {
    this.facade.loadMorphologyFromSelectedAyahs({ merge: true });
  }

  saveTask() {
    this.facade.saveTask('morphology');
  }

  commitLexicon() {
    const tab = this.tab;
    if (!tab) return;
    this.facade.commitMorphologyTask(tab);
  }

  trackByItem(index: number, item: Record<string, unknown>) {
    const key = typeof item['word_location'] === 'string' ? item['word_location'] : '';
    return key || index;
  }

  itemValue(item: Record<string, unknown>, key: string) {
    return item[key] ?? '';
  }

  updateItem(index: number, key: string, value: string) {
    const tab = this.tab;
    if (!tab) return;
    const items = this.items;
    if (index < 0 || index >= items.length) return;
    const item = items[index];
    if (!item) return;
    const trimmed = typeof value === 'string' ? value.trim() : value;
    if (trimmed === '' || trimmed == null) {
      delete item[key];
    } else {
      item[key] = trimmed;
    }
    if (key === 'lemma_ar') {
      const normalized = this.normalizeArabic(String(trimmed ?? ''));
      if (normalized) {
        item['lemma_norm'] = normalized;
      }
    }
    if (key === 'root_norm') {
      const normalized = this.normalizeArabic(String(trimmed ?? ''));
      if (normalized) {
        item['root_norm'] = normalized;
      }
    }
    this.writeItems(items);
  }

  updatePos(index: number, value: string) {
    this.updateItem(index, 'pos', value);
  }

  removeItem(index: number) {
    const tab = this.tab;
    if (!tab) return;
    const items = this.items;
    if (index < 0 || index >= items.length) return;
    items.splice(index, 1);
    this.writeItems(items);
  }

  private writeItems(items: Array<Record<string, unknown>>) {
    const tab = this.tab;
    if (!tab) return;
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(tab.json || '{}') as Record<string, unknown>;
    } catch {
      payload = {};
    }
    payload['schema_version'] = payload['schema_version'] ?? 1;
    payload['task_type'] = 'morphology';
    payload['surah'] = this.state.selectedSurah ?? payload['surah'];
    payload['ayah_from'] = this.state.rangeStart ?? payload['ayah_from'];
    payload['ayah_to'] = this.state.rangeEnd ?? this.state.rangeStart ?? payload['ayah_to'];
    payload['items'] = items;
    tab.json = JSON.stringify(payload, null, 2);
  }

  private normalizeArabic(text: string) {
    return String(text ?? '').normalize('NFKC').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').trim();
  }
}
