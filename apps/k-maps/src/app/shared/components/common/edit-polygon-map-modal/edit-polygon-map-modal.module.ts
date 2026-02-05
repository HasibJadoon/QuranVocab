import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitEditPolygonMapModalComponent } from './edit-polygon-map-modal.component';
import { TranslateModule } from '@ngx-translate/core';
import { McitDialogModule } from '../dialog/dialog.module';
import { McitMapModule } from '../map/map.module';
import { McitEditPolygonMapModalService } from './edit-polygon-map-modal.service';
import { MatGridListModule } from '@angular/material/grid-list';

@NgModule({
  imports: [CommonModule, TranslateModule, McitDialogModule, McitMapModule, MatGridListModule],
  declarations: [McitEditPolygonMapModalComponent],
  providers: [McitEditPolygonMapModalService]
})
export class McitEditPolygonMapModalModule {}
