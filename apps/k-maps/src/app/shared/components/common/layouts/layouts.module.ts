import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { McitBackLayoutComponent } from './back-layout/back-layout.component';
import { McitCloseActionLayoutComponent } from './close-action-layout/close-action-layout.component';
import { McitMenuLayoutComponent } from './menu-layout/menu-layout.component';
import { McitFooterComponent } from './widgets/footer/footer.component';
import { McitMenuComponent } from './widgets/menu/menu.component';
import { McitTabMenuComponent } from './widgets/tab-menu/tab-menu.component';
import { McitMenuSidenavComponent } from './widgets/menu-sidenav/menu-sidenav.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { McitBreadCrumbsModule } from '../breadcrumbs/breadcrumbs.module';
import { McitCommonModule } from '../common/common.module';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { McitContainerDirective } from './directives/container.directive';
import { McitDropdownModule } from '../dropdown/dropdown.module';
import { FormsModule } from '@angular/forms';
import { PortalModule } from '@angular/cdk/portal';
import { McitInfoModalModule } from '../info-modal/info-modal.module';

@NgModule({
  imports: [CommonModule, RouterModule, TranslateModule, MatToolbarModule, McitBreadCrumbsModule, McitCommonModule, ScrollingModule, McitDropdownModule, FormsModule, PortalModule, McitInfoModalModule],
  declarations: [McitBackLayoutComponent, McitCloseActionLayoutComponent, McitMenuLayoutComponent, McitFooterComponent, McitMenuComponent, McitTabMenuComponent, McitMenuSidenavComponent, McitContainerDirective],
  exports: [McitBackLayoutComponent, McitCloseActionLayoutComponent, McitMenuLayoutComponent]
})
export class McitLayoutsModule {}
