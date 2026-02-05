import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { McitBackLayoutComponent } from '../layouts/back-layout/back-layout.component';
import { McitNotificationViewComponent } from './notification-view/notification-view.component';

const routes: Routes = [
  {
    path: '',
    component: McitBackLayoutComponent,
    children: [{ path: '', component: McitNotificationViewComponent, data: { title: 'NOTIFICATION.TITLE', subtitle: '' } }]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class McitNotificationRoutingModule {}
