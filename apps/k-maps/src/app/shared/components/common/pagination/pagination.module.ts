import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { McitPaginationComponent } from './pagination.component';
import { McitMenuDropdownModule } from '../menu-dropdown/menu-dropdown.module';
import { McitTotalPagePipe } from './pipes/total-page.pipe';

@NgModule({
  imports: [CommonModule, TranslateModule, McitMenuDropdownModule],
  declarations: [McitPaginationComponent, McitTotalPagePipe],
  exports: [McitPaginationComponent, McitTotalPagePipe]
})
export class McitPaginationModule {}
