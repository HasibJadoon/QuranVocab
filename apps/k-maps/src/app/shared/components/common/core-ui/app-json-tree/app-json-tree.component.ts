import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-json-tree',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-json-tree.component.html',
  styleUrls: ['./app-json-tree.component.scss'],
})
export class AppJsonTreeComponent {
  @Input() value: unknown;
  @Input() collapsed = true;
  @Input() showRoot = true;

  get isArray() {
    return Array.isArray(this.value);
  }

  get isObject() {
    return !!this.value && typeof this.value === 'object' && !this.isArray;
  }

  get isCollection() {
    return this.isArray || this.isObject;
  }

  get count() {
    if (this.isArray) return (this.value as unknown[]).length;
    if (this.isObject) return Object.keys(this.value as Record<string, unknown>).length;
    return 0;
  }

  get entries(): Array<{ key: string; value: unknown }> {
    if (this.isArray) {
      return (this.value as unknown[]).map((val, idx) => ({ key: String(idx), value: val }));
    }
    if (this.isObject) {
      return Object.entries(this.value as Record<string, unknown>).map(([key, val]) => ({
        key,
        value: val,
      }));
    }
    return [];
  }

  formatScalar(value: unknown): string {
    if (value === null) return 'null';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return String(value ?? '');
  }
}
