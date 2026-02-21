import { Component } from '@angular/core';
import { albumsOutline, gridOutline, listOutline, statsChartOutline } from 'ionicons/icons';
import { IconTabItem } from '../../../shared/components/icon-tabs/icon-tabs.component';

@Component({
  selector: 'app-planner-tabs-page',
  standalone: false,
  templateUrl: './planner-tabs.page.html',
  styleUrl: './planner-tabs.page.scss',
})
export class PlannerTabsPage {
  readonly plannerTabs: IconTabItem[] = [
    { key: 'week', icon: listOutline, label: 'Week' },
    { key: 'kanban', icon: gridOutline, label: 'Kanban' },
    { key: 'inbox', icon: albumsOutline, label: 'Inbox' },
    { key: 'review', icon: statsChartOutline, label: 'Review' },
  ];
}
