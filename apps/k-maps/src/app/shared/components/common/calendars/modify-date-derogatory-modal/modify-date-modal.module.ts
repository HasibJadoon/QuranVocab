import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitDateLocalFieldModule } from '../../date-local-field/date-local-field.module';
import { ModifyDateModalService } from './modify-date-modal.service';
import { ModifyDateDerogatoryModalComponent } from './modify-date-derogatory-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { EqualDatePipe } from '../pipe/delete-derogatory-date.pipe';

@NgModule({
  declarations: [ModifyDateDerogatoryModalComponent, EqualDatePipe],
  imports: [CommonModule, McitDateLocalFieldModule, FormsModule, ReactiveFormsModule, TranslateModule],
  exports: [EqualDatePipe],
  providers: [ModifyDateModalService]
})
export class McitModifyDateModalModule {}
