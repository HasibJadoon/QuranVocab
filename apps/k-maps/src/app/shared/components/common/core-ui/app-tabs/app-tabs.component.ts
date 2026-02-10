import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import { Params, Router } from '@angular/router';

export type AppTabVariant = 'tabs' | 'pills';
export type AppTabOrientation = 'horizontal' | 'vertical';

export type AppTabItem = {
  id: string;
  label: string;
  disabled?: boolean;
  badge?: string | number;
  iconUrl?: string;
  commands?: any[];
  queryParams?: Params;
};

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-tabs.component.html',
  styleUrls: ['./app-tabs.component.scss'],
})
export class AppTabsComponent {
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  @Input({ required: true }) tabs: AppTabItem[] = [];
  @Input() activeId: string | null = null;
  @Input() variant: AppTabVariant = 'tabs';
  @Input() orientation: AppTabOrientation = 'horizontal';
  @Input() ariaLabel = 'Tabs';
  @Input() primaryIds: string[] | null = null;
  @Input() overflowLabel = 'More';

  @Output() tabChange = new EventEmitter<AppTabItem>();

  dropdownOpen = false;

  get isVertical() {
    return this.orientation === 'vertical';
  }

  get isPills() {
    return this.variant === 'pills';
  }

  get primaryTabs(): AppTabItem[] {
    if (!this.primaryIds?.length) return this.tabs;
    return this.tabs.filter((tab) => this.primaryIds!.includes(tab.id));
  }

  get overflowTabs(): AppTabItem[] {
    if (!this.primaryIds?.length) return [];
    return this.tabs.filter((tab) => !this.primaryIds!.includes(tab.id));
  }

  get isOverflowActive(): boolean {
    return this.overflowTabs.some((tab) => tab.id === this.activeId);
  }

  trackByTabId(_: number, tab: AppTabItem) {
    return tab.id;
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectTab(tab: AppTabItem) {
    if (tab.disabled) return;
    this.dropdownOpen = false;
    if (tab.commands?.length) {
      if (tab.queryParams) {
        this.router.navigate(tab.commands, { queryParams: tab.queryParams, queryParamsHandling: 'merge' });
      } else {
        this.router.navigate(tab.commands);
      }
    }
    this.tabChange.emit(tab);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.dropdownOpen) return;
    if (this.elementRef.nativeElement.contains(event.target)) return;
    this.dropdownOpen = false;
  }
}
