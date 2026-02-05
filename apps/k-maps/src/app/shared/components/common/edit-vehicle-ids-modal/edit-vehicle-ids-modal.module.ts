import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitDialogModule } from '../dialog/dialog.module';
import { TranslateModule } from '@ngx-translate/core';
import { McitEditVehicleIdsModalComponent } from './edit-vehicle-ids-modal.component';
import { McitEditVehicleIdsModalService } from './edit-vehicle-ids-modal.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitFormsModule } from '../forms/forms.module';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, McitDialogModule, McitFormsModule, CodemirrorModule],
  declarations: [McitEditVehicleIdsModalComponent],
  providers: [McitEditVehicleIdsModalService]
})
export class McitEditVehicleIdsModalModule {}
