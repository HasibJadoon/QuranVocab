import { Component } from '@angular/core';
import { albumsOutline, listOutline, micOutline, statsChartOutline } from 'ionicons/icons';

type PlannerTabItem = {
  key: string;
  icon: string;
  label: string;
  href: string;
};

@Component({
  selector: 'app-planner-tabs-page',
  standalone: false,
  templateUrl: './planner-tabs.page.html',
  styleUrl: './planner-tabs.page.scss',
})
export class PlannerTabsPage {
  readonly plannerTabs: PlannerTabItem[] = [
    { key: 'week', icon: listOutline, label: 'Week', href: '/planner/week' },
    { key: 'inbox', icon: albumsOutline, label: 'Inbox', href: '/planner/inbox' },
    { key: 'podcast', icon: micOutline, label: 'Podcast', href: '/planner/podcast' },
    { key: 'review', icon: statsChartOutline, label: 'Review', href: '/planner/review' },
  ];
}
