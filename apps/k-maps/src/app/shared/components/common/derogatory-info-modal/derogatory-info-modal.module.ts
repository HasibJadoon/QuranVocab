import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitDialogModule } from '../dialog/dialog.module';
import { TranslateModule } from '@ngx-translate/core';
import { McitDerogatoryInfoModalComponent } from './derogatory-info-modal.component';
import { McitDerogatoryInfoModalService } from './derogatory-info-modal.service';
import { McitDerogatoryInformationTooltipPipe } from './pipes/derogatory-information-tooltip.pipe';

@NgModule({
  imports: [CommonModule, TranslateModule, McitDialogModule],
  declarations: [McitDerogatoryInfoModalComponent, McitDerogatoryInformationTooltipPipe],
  providers: [McitDerogatoryInfoModalService],
  exports: [McitDerogatoryInformationTooltipPipe]
})
export class McitDerogatoryInfoModalModule {}
