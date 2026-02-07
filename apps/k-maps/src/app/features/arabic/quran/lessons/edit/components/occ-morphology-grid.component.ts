import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { QuranLessonTokenV2 } from '../../../../../../shared/models/arabic/quran-lesson.model';

@Component({
  selector: 'app-occ-morphology-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pane-head">
      <h3>صرف (اسم / فعل)</h3>
      <div class="pane-actions">
        <span class="pane-toggle">{{ tokens.length }} Tokens</span>
      </div>
    </div>

    <div class="table-wrap" *ngIf="tokens.length; else emptyTpl">
      <table class="editor-table editor-table--morph">
        <thead>
          <tr>
            <th>#</th>
            <th>Surface</th>
            <th>Lemma</th>
            <th>POS</th>
            <th>Morphology</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let token of tokens; let index = index; trackBy: trackByToken">
            <td>{{ index + 1 }}</td>
            <td class="text-arabic" dir="rtl">{{ token.surface_ar || '—' }}</td>
            <td class="text-arabic" dir="rtl">{{ token.lemma_ar || '—' }}</td>
            <td>{{ posLabel(token.pos) }}</td>
            <td>
              <div class="feature-controls feature-controls--noun" *ngIf="token.pos === 'noun'">
                <select
                  [ngModel]="featureValue(token, 'status')"
                  (ngModelChange)="setFeatureValue(token, 'status', $event)"
                >
                  <option [ngValue]="null">الحالة</option>
                  <option [ngValue]="'مرفوع'">مرفوع</option>
                  <option [ngValue]="'منصوب'">منصوب</option>
                  <option [ngValue]="'مجرور'">مجرور</option>
                </select>
                <select
                  [ngModel]="featureValue(token, 'number')"
                  (ngModelChange)="setFeatureValue(token, 'number', $event)"
                >
                  <option [ngValue]="null">العدد</option>
                  <option [ngValue]="'مفرد'">مفرد</option>
                  <option [ngValue]="'مثنى'">مثنى</option>
                  <option [ngValue]="'جمع'">جمع</option>
                </select>
                <select
                  [ngModel]="featureValue(token, 'gender')"
                  (ngModelChange)="setFeatureValue(token, 'gender', $event)"
                >
                  <option [ngValue]="null">الجنس</option>
                  <option [ngValue]="'مذكر'">مذكر</option>
                  <option [ngValue]="'مؤنث'">مؤنث</option>
                </select>
                <select
                  [ngModel]="featureValue(token, 'type')"
                  (ngModelChange)="setFeatureValue(token, 'type', $event)"
                >
                  <option [ngValue]="null">التعريف</option>
                  <option [ngValue]="'معرفة'">معرفة</option>
                  <option [ngValue]="'نكرة'">نكرة</option>
                </select>
              </div>

              <div class="feature-controls feature-controls--verb" *ngIf="token.pos === 'verb'">
                <select
                  [ngModel]="featureValue(token, 'tense')"
                  (ngModelChange)="setFeatureValue(token, 'tense', $event)"
                >
                  <option [ngValue]="null">الزمن</option>
                  <option [ngValue]="'ماضٍ'">ماضٍ</option>
                  <option [ngValue]="'مضارع'">مضارع</option>
                  <option [ngValue]="'أمر'">أمر</option>
                </select>
                <select
                  [ngModel]="featureValue(token, 'mood')"
                  (ngModelChange)="setFeatureValue(token, 'mood', $event)"
                >
                  <option [ngValue]="null">الإعراب</option>
                  <option [ngValue]="'مرفوع'">مرفوع</option>
                  <option [ngValue]="'منصوب'">منصوب</option>
                  <option [ngValue]="'مجزوم'">مجزوم</option>
                </select>
                <select
                  [ngModel]="featureValue(token, 'voice')"
                  (ngModelChange)="setFeatureValue(token, 'voice', $event)"
                >
                  <option [ngValue]="null">البناء</option>
                  <option [ngValue]="'معلوم'">معلوم</option>
                  <option [ngValue]="'مجهول'">مجهول</option>
                </select>
                <select
                  [ngModel]="featureValue(token, 'person')"
                  (ngModelChange)="setFeatureValue(token, 'person', $event)"
                >
                  <option [ngValue]="null">الشخص</option>
                  <option [ngValue]="'متكلم'">متكلم</option>
                  <option [ngValue]="'مخاطب'">مخاطب</option>
                  <option [ngValue]="'غائب'">غائب</option>
                </select>
                <select
                  [ngModel]="featureValue(token, 'number')"
                  (ngModelChange)="setFeatureValue(token, 'number', $event)"
                >
                  <option [ngValue]="null">العدد</option>
                  <option [ngValue]="'مفرد'">مفرد</option>
                  <option [ngValue]="'مثنى'">مثنى</option>
                  <option [ngValue]="'جمع'">جمع</option>
                </select>
                <select
                  [ngModel]="featureValue(token, 'gender')"
                  (ngModelChange)="setFeatureValue(token, 'gender', $event)"
                >
                  <option [ngValue]="null">الجنس</option>
                  <option [ngValue]="'مذكر'">مذكر</option>
                  <option [ngValue]="'مؤنث'">مؤنث</option>
                </select>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ng-template #emptyTpl>
      <p class="empty-state">لا توجد أفعال أو أسماء لهذه الآية بعد.</p>
    </ng-template>
  `,
})
export class OccMorphologyGridComponent {
  @Input() tokens: QuranLessonTokenV2[] = [];
  @Output() changed = new EventEmitter<void>();

  trackByToken = (_index: number, token: QuranLessonTokenV2) =>
    token.token_occ_id || `${token.unit_id}-${token.pos_index}-${_index}`;

  posLabel(pos: string | null | undefined) {
    if (pos === 'noun') return 'اسم';
    if (pos === 'verb') return 'فعل';
    return '—';
  }

  featureValue(token: QuranLessonTokenV2, key: string) {
    const features = token.features && typeof token.features === 'object' ? token.features : null;
    if (!features) return null;
    return (features as Record<string, unknown>)[key] ?? null;
  }

  setFeatureValue(token: QuranLessonTokenV2, key: string, value: unknown) {
    if (!token.features || typeof token.features !== 'object') {
      token.features = {};
    }
    const features = token.features as Record<string, unknown>;
    if (value == null || value === '') {
      delete features[key];
    } else {
      features[key] = value;
    }
    if (!Object.keys(features).length) {
      token.features = null;
    }
    this.changed.emit();
  }
}
