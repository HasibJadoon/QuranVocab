import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { McitBigMenuComponent } from './big-menu.component';
import { RouterModule } from '@angular/router';
import { McitCommonModule } from '../common/common.module';
import { McitTooltipModule } from '../tooltip/tooltip.module';

@NgModule({
  imports: [CommonModule, TranslateModule, RouterModule, McitCommonModule, McitTooltipModule],
  declarations: [McitBigMenuComponent],
  exports: [McitBigMenuComponent]
})
export class McitBigMenuModule {}
