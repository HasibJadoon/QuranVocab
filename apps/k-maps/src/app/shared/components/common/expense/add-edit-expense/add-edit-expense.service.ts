import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../../dialog/dialog.service';
import { McitAddEditExpenseComponent } from './add-edit-expense.component';
import { IExpense } from '../../models/expense.model';

@Injectable({
  providedIn: 'root'
})
export class McitAddEditExpenseService {
  constructor(private dialog: McitDialog) {}

  open(expenseContext?: Pick<IExpense, 'owner_id' | 'attached_object' | 'resources'>, expense_id?: string, formDisabled?: boolean): Observable<IExpense> {
    const dialogRef = this.dialog.open<McitAddEditExpenseComponent, any, any>(McitAddEditExpenseComponent, {
      dialogClass: 'modal-lg',
      disableClose: false,
      data: { expenseContext, expense_id, formDisabled }
    });
    return dialogRef.afterClosed();
  }
}
