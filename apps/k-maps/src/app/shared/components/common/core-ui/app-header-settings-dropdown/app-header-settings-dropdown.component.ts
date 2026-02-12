import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  DropdownComponent,
  DropdownMenuDirective,
  DropdownToggleDirective,
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';

import { AuthService } from '../../../../services/AuthService';

@Component({
  selector: 'app-header-settings-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    DropdownComponent,
    DropdownMenuDirective,
    DropdownToggleDirective,
    IconDirective,
  ],
  templateUrl: './app-header-settings-dropdown.component.html',
  styleUrls: ['./app-header-settings-dropdown.component.scss'],
})
export class AppHeaderSettingsDropdownComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly scriptModes = ['Uthmani', 'IndoPak', 'Tajweed'];
  readonly fontStyles = [
    {
      label: 'Uthmanic Hafs',
      value: '"Uthmanic Hafs", "Scheherazade New", "Amiri", "Noto Naskh Arabic", "Cairo", serif',
    },
    {
      label: 'Scheherazade New',
      value: '"Scheherazade New", "Amiri", "Noto Naskh Arabic", "Cairo", serif',
    },
    {
      label: 'Amiri',
      value: '"Amiri", "Scheherazade New", "Noto Naskh Arabic", "Cairo", serif',
    },
    {
      label: 'Noto Naskh Arabic',
      value: '"Noto Naskh Arabic", "Amiri", "Scheherazade New", "Cairo", serif',
    },
    {
      label: 'Cairo',
      value: '"Cairo", "Noto Naskh Arabic", "Amiri", "Scheherazade New", serif',
    },
  ];

  selectedScriptMode = this.scriptModes[0];
  selectedFontStyle = this.fontStyles[0];
  activePreviewTab: 'arabic' | 'english' | 'system' = 'arabic';
  arabicFontSize = 23;
  englishFontSize = 22;
  menuTextSize = 15;
  headerTextSize = 15;
  footerTextSize = 14;

  constructor() {
    this.loadFontSize();
    this.loadArabicFontSize();
    this.loadArabicFontStyle();
    this.loadSystemTextSizes();
  }

  get previewArabicText(): string {
    return 'الر تلك آيات الكتاب المبين';
  }

  get previewTranslationText(): string {
    return 'In the Name of Allah—the Most Compassionate, Most Merciful.';
  }

  get previewTranslationFontSize(): number {
    return this.englishFontSize;
  }

  setPreviewTab(tab: 'arabic' | 'english' | 'system') {
    this.activePreviewTab = tab;
  }

  selectScriptMode(mode: string) {
    this.selectedScriptMode = mode;
  }

  selectFontStyle(value: string) {
    const match = this.fontStyles.find((option) => option.value === value || option.label === value);
    this.selectedFontStyle = match ?? this.fontStyles[0];
    this.applyArabicFontFamily(this.selectedFontStyle.value);
  }

  onFontStyleChange(event: Event) {
    const target = event.target as HTMLSelectElement | null;
    if (!target?.value) return;
    this.selectFontStyle(target.value);
  }

  onArabicFontSizeInput(event: Event) {
    const target = event.target as { value?: string } | null;
    if (!target?.value) return;
    const value = Number(target.value);
    if (!Number.isFinite(value)) return;
    this.arabicFontSize = value;
    this.applyArabicFontSize(value);
  }

  onEnglishFontSizeInput(event: Event) {
    const target = event.target as { value?: string } | null;
    if (!target?.value) return;
    const value = Number(target.value);
    if (!Number.isFinite(value)) return;
    this.englishFontSize = value;
    this.applyFontSize(value);
  }

  onMenuTextSizeInput(event: Event) {
    const target = event.target as { value?: string } | null;
    if (!target?.value) return;
    const value = Number(target.value);
    if (!Number.isFinite(value)) return;
    this.menuTextSize = value;
    this.applyMenuTextSize(value);
  }

  onHeaderTextSizeInput(event: Event) {
    const target = event.target as { value?: string } | null;
    if (!target?.value) return;
    const value = Number(target.value);
    if (!Number.isFinite(value)) return;
    this.headerTextSize = value;
    this.applyHeaderTextSize(value);
  }

  onFooterTextSizeInput(event: Event) {
    const target = event.target as { value?: string } | null;
    if (!target?.value) return;
    const value = Number(target.value);
    if (!Number.isFinite(value)) return;
    this.footerTextSize = value;
    this.applyFooterTextSize(value);
  }

  resetAppearance() {
    this.selectedScriptMode = this.scriptModes[0];
    this.selectedFontStyle = this.fontStyles[0];
    this.loadFontSize();
    this.loadArabicFontSize();
    this.applyArabicFontFamily(this.selectedFontStyle.value);
    this.loadSystemTextSizes();
    this.activePreviewTab = 'arabic';
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  private applyFontSize(value: number) {
    const doc = (globalThis as any)?.document as any;
    if (!doc?.documentElement) return;
    doc.documentElement.style.setProperty('--app-body-font-size', `${value}px`);
    try {
      (globalThis as any)?.localStorage?.setItem('app_body_font_size', String(value));
    } catch {
      // ignore storage errors
    }
  }

  private applyArabicFontSize(value: number) {
    const doc = (globalThis as any)?.document as any;
    if (!doc?.documentElement) return;
    doc.documentElement.style.setProperty('--app-ar-font-size', `${value}px`);
    try {
      (globalThis as any)?.localStorage?.setItem('app_ar_font_size', String(value));
    } catch {
      // ignore storage errors
    }
  }

  private loadFontSize() {
    const doc = (globalThis as any)?.document as any;
    if (!doc?.documentElement) return;
    let value = 16;
    try {
      const storage = (globalThis as any)?.localStorage;
      const storedBody = Number(storage?.getItem('app_body_font_size'));
      const storedLegacy = Number(storage?.getItem('app_font_size'));
      const stored = Number.isFinite(storedBody) ? storedBody : storedLegacy;
      if (Number.isFinite(stored)) {
        value = Math.min(74, Math.max(12, stored));
      }
    } catch {
      // ignore storage errors
    }
    this.englishFontSize = value;
    this.applyFontSize(value);
  }

  private loadArabicFontSize() {
    const doc = (globalThis as any)?.document as any;
    if (!doc?.documentElement) return;
    let value = 20;
    try {
      const stored = Number((globalThis as any)?.localStorage?.getItem('app_ar_font_size'));
      if (Number.isFinite(stored)) value = Math.min(74, Math.max(14, stored));
    } catch {
      // ignore storage errors
    }
    this.arabicFontSize = value;
    this.applyArabicFontSize(value);
  }

  private applyArabicFontFamily(value: string) {
    const doc = (globalThis as any)?.document as any;
    if (!doc?.documentElement) return;
    doc.documentElement.style.setProperty('--app-font-ar', value);
    try {
      (globalThis as any)?.localStorage?.setItem('app_ar_font_family', String(value));
    } catch {
      // ignore storage errors
    }
  }

  private loadArabicFontStyle() {
    const doc = (globalThis as any)?.document as any;
    if (!doc?.documentElement) return;
    let value = this.fontStyles[0]?.value ?? '';
    try {
      const stored = String((globalThis as any)?.localStorage?.getItem('app_ar_font_family') ?? '');
      if (stored) value = stored;
    } catch {
      // ignore storage errors
    }
    const match = this.fontStyles.find((option) => option.value === value || option.label === value);
    this.selectedFontStyle = match ?? this.fontStyles[0];
    if (this.selectedFontStyle?.value) {
      this.applyArabicFontFamily(this.selectedFontStyle.value);
    }
  }

  private loadSystemTextSizes() {
    this.loadMenuTextSize();
    this.loadHeaderTextSize();
    this.loadFooterTextSize();
  }

  private applyMenuTextSize(value: number) {
    const doc = (globalThis as any)?.document as any;
    if (!doc?.documentElement) return;
    doc.documentElement.style.setProperty('--app-menu-font-size', `${value}px`);
    try {
      (globalThis as any)?.localStorage?.setItem('app_menu_text_size', String(value));
    } catch {
      // ignore storage errors
    }
  }

  private applyHeaderTextSize(value: number) {
    const doc = (globalThis as any)?.document as any;
    if (!doc?.documentElement) return;
    doc.documentElement.style.setProperty('--app-header-font-size', `${value}px`);
    doc.documentElement.style.setProperty('--app-header-title-size', `${value + 2}px`);
    try {
      (globalThis as any)?.localStorage?.setItem('app_header_text_size', String(value));
    } catch {
      // ignore storage errors
    }
  }

  private applyFooterTextSize(value: number) {
    const doc = (globalThis as any)?.document as any;
    if (!doc?.documentElement) return;
    doc.documentElement.style.setProperty('--app-footer-font-size', `${value}px`);
    try {
      (globalThis as any)?.localStorage?.setItem('app_footer_text_size', String(value));
    } catch {
      // ignore storage errors
    }
  }

  private loadMenuTextSize() {
    let value = 15;
    try {
      const stored = Number((globalThis as any)?.localStorage?.getItem('app_menu_text_size'));
      if (Number.isFinite(stored)) value = Math.min(28, Math.max(12, stored));
    } catch {
      // ignore storage errors
    }
    this.menuTextSize = value;
    this.applyMenuTextSize(value);
  }

  private loadHeaderTextSize() {
    let value = 15;
    try {
      const stored = Number((globalThis as any)?.localStorage?.getItem('app_header_text_size'));
      if (Number.isFinite(stored)) value = Math.min(28, Math.max(12, stored));
    } catch {
      // ignore storage errors
    }
    this.headerTextSize = value;
    this.applyHeaderTextSize(value);
  }

  private loadFooterTextSize() {
    let value = 14;
    try {
      const stored = Number((globalThis as any)?.localStorage?.getItem('app_footer_text_size'));
      if (Number.isFinite(stored)) value = Math.min(28, Math.max(11, stored));
    } catch {
      // ignore storage errors
    }
    this.footerTextSize = value;
    this.applyFooterTextSize(value);
  }
}
