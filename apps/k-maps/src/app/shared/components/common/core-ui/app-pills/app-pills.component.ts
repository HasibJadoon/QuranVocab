import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

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

  trackByItem(index: number, item: AppPillItem): string | number {
    if (item.id != null) return item.id;
    return `${item.primary}|${item.secondary ?? ''}|${index}`;
  }
}

