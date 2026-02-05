import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { McitSidePanelComponent } from './side-panel.component';
import { McitTooltipModule } from '../tooltip/tooltip.module';

@NgModule({
  imports: [CommonModule, RouterModule, TranslateModule, McitTooltipModule],
  declarations: [McitSidePanelComponent],
  exports: [McitSidePanelComponent],
  providers: []
})
export class McitSidePanelModule {}
