import { CommonModule } from '@angular/common';
import { NgxLoadingModule } from 'ngx-loading';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitFormsModule } from '@lib-shared/common/forms/forms.module';
import { McitCommonModule } from '@lib-shared/common/common/common.module';
import { MatGridListModule } from '@angular/material/grid-list';
import { McitAddEditExpenseComponent } from './add-edit-expense.component';
import { McitAddEditExpenseService } from './add-edit-expense.service';
import { CharterBusinessModule } from 'projects/dispatcher/src/app/business/charter/charter-business.module';

@NgModule({
  imports: [CommonModule, NgxLoadingModule, McitFormsModule, TranslateModule, McitCommonModule, FormsModule, ReactiveFormsModule, MatGridListModule, CharterBusinessModule],
  declarations: [McitAddEditExpenseComponent],
  providers: [McitAddEditExpenseService]
})
export class McitAddEditExpenseModule {}
