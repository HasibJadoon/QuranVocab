import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export type AppPillItem = {
  id?: string | number;
  primary: string;
  secondary?: string;
};

@Component({
  selector: 'app-pills',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-pills.component.html',
  styleUrls: ['./app-pills.component.scss'],
})
export class AppPillsComponent {
  @Input() items: AppPillItem[] = [];
  @Input() ariaLabel = 'Pills';
  @Input() clickable = false;
  @Output() itemSelect = new EventEmitter<AppPillItem>();

  trackByItem(index: number, item: AppPillItem): string | number {
    if (item.id != null) return item.id;
    return `${item.primary}|${item.secondary ?? ''}|${index}`;
  }

  onItemClick(item: AppPillItem) {
    if (!this.clickable) return;
    this.itemSelect.emit(item);
  }

  onItemKeydown(event: KeyboardEvent, item: AppPillItem) {
    if (!this.clickable) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.itemSelect.emit(item);
  }
}
