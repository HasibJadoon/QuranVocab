import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { NgxLoadingModule } from 'ngx-loading';

import { McitCommonModule } from '../../common/common.module';
import { McitImageViewerOverlayModule } from '../../image-viewer-overlay/image-viewer-overlay.module';
import { McitQuestionModalModule } from '../../question-modal/question-modal.module';
import { McitDamageListComponent } from './widgets/damage-list/damage-list.component';
import { McitDamageShowComponent } from './widgets/damage-show/damage-show.component';
import { McitDamageExtService } from './damage-ext.service';
import { McitDamageIntService } from './damage-int.service';
import { McitDamageService } from './damage.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitLayoutsModule } from '../../layouts/layouts.module';
import { McitQuestionDiscardModalModule } from '../../question-discard-modal/question-discard-modal.module';
import { TranslateModule } from '@ngx-translate/core';
import { McitDamageItemViewModalComponent } from './damage-item-view-modal/damage-item-view-modal.component';
import { McitDamageDetailsShowComponent } from './widgets/damage-details-show/damage-details-show.component';
import { McitSvgVehicleDamagesModule } from '../../svg-vehicle-damages/svg-vehicle-damages.module';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    NgxLoadingModule,
    FormsModule,
    McitCommonModule,
    McitLayoutsModule,
    ReactiveFormsModule,
    MatGridListModule,
    McitQuestionDiscardModalModule,
    MatGridListModule,
    McitImageViewerOverlayModule,
    McitQuestionModalModule,
    McitSvgVehicleDamagesModule
  ],
  declarations: [McitDamageItemViewModalComponent, McitDamageListComponent, McitDamageShowComponent, McitDamageDetailsShowComponent],
  providers: [McitDamageExtService, McitDamageIntService, McitDamageService],
  exports: [McitDamageItemViewModalComponent, McitDamageListComponent, McitDamageShowComponent, McitDamageDetailsShowComponent]
})
export class McitDamagesModule {}
