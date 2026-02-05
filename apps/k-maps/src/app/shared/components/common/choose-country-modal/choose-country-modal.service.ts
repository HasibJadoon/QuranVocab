import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitChooseCountryModalComponent } from './choose-country-modal.component';
import { McitDialog } from '../dialog/dialog.service';

@Injectable()
export class McitChooseCountryModalService {
  constructor(private dialog: McitDialog) {}

  chooseCountry(codes: string[]): Observable<string[]> {
    const ref = this.dialog.open<McitChooseCountryModalComponent, any, string[]>(McitChooseCountryModalComponent, {
      dialogClass: 'modal-lg modal-dialog-centered',
      disableClose: false,
      data: {
        codes
      }
    });
    return ref.afterClosed();
  }
}
