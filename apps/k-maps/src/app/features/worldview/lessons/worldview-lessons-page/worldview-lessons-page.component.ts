import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { worldviewEntries } from '../worldview-mock';
import { WorldviewEntrySummary } from '../../../../shared/models/worldview/worldview-entry.model';
import { AppHeaderbarComponent } from '../../../../shared/components';

@Component({
  selector: 'app-worldview-lessons-page',
  standalone: true,
  imports: [CommonModule, AppHeaderbarComponent],
  templateUrl: './worldview-lessons-page.component.html',
  styleUrls: ['./worldview-lessons-page.component.scss']
})
export class WorldviewLessonsPageComponent implements OnInit, OnDestroy {
  q = '';
  rows: WorldviewEntrySummary[] = worldviewEntries;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      this.q = params.get('q') ?? '';
      this.applyFilters();
    });
  }

  ngOnDestroy() {}

  onHeaderSearchInput(value: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: value || null },
      queryParamsHandling: 'merge',
    });
  }

  openEntry(id: number) {
    this.router.navigate(['/worldview/lessons', id]);
  }

  openEdit(id: number) {
    this.router.navigate(['/worldview/lessons', id], { queryParams: { mode: 'edit' } });
  }

  openCapture() {
    this.router.navigate(['/worldview/lessons/new'], { queryParams: { mode: 'capture' } });
  }

  statusBadgeClass(status: string) {
    const normalized = (status ?? '').toLowerCase();
    switch (normalized) {
      case 'processed':
        return 'bg-success';
      case 'linked':
        return 'bg-info text-dark';
      case 'raw':
      default:
        return 'bg-secondary';
    }
  }

  private applyFilters() {
    const q = this.q.trim().toLowerCase();
    this.rows = worldviewEntries.filter((entry: WorldviewEntrySummary) => {
      if (!q) return true;
      return (
        entry.source.title.toLowerCase().includes(q) ||
        entry.source.creator.toLowerCase().includes(q) ||
        entry.summary.one_line.toLowerCase().includes(q)
      );
    });
  }
}
