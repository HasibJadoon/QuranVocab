import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { McitDialogModule } from '../dialog/dialog.module';
import { McitMapModule } from '../map/map.module';
import { McitEditGeopositionMapModalComponent } from './edit-geoposition-map-modal.component';
import { McitEditGeopositionMapModalService } from './edit-geoposition-map-modal.service';
import { MatGridListModule } from '@angular/material/grid-list';

@NgModule({
  imports: [CommonModule, TranslateModule, McitDialogModule, McitMapModule, MatGridListModule],
  declarations: [McitEditGeopositionMapModalComponent],
  providers: [McitEditGeopositionMapModalService]
})
export class McitEditGeopositionMapModalModule {}
