import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlannerInboxPage } from './planner-inbox.page';
import { PlannerKanbanPage } from './planner-kanban.page';
import { PlannerReviewPage } from './planner-review.page';
import { PlannerTabsPage } from './planner-tabs.page';
import { WeeklyPlanPage } from './weekly-plan.page';

const routes: Routes = [
  {
    path: '',
    component: PlannerTabsPage,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'week',
      },
      {
        path: 'week',
        component: WeeklyPlanPage,
      },
      {
        path: 'kanban',
        component: PlannerKanbanPage,
      },
      {
        path: 'inbox',
        component: PlannerInboxPage,
      },
      {
        path: 'review',
        component: PlannerReviewPage,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WeeklyPlanPageRoutingModule {}
