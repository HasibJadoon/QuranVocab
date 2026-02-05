import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitDialogModule } from '../dialog/dialog.module';
import { TranslateModule } from '@ngx-translate/core';
import { McitEditParkStructureSquaresModalComponent } from './edit-park-structures-squares-modal.component';
import { McitEditParkStructureSquaresModalService } from './edit-park-structures-squares-modal.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitFormsModule } from '../forms/forms.module';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, McitDialogModule, McitFormsModule, CodemirrorModule],
  declarations: [McitEditParkStructureSquaresModalComponent],
  providers: [McitEditParkStructureSquaresModalService]
})
export class McitEditParkStructureSquaresModalModule {}
