import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IOptions, McitChooseCountryPhoneModalComponent } from './choose-country-phone-modal.component';
import { CountryPhone } from '../models/country';
import { McitDialog } from '../dialog/dialog.service';

@Injectable()
export class McitChooseCountryPhoneModalService {
  constructor(private dialog: McitDialog) {}

  chooseCountryPhone(code: string, options?: IOptions): Observable<CountryPhone | string> {
    const ref = this.dialog.open<McitChooseCountryPhoneModalComponent, any, CountryPhone | string>(McitChooseCountryPhoneModalComponent, {
      dialogClass: 'modal-lg modal-dialog-centered',
      disableClose: false,
      data: {
        code,
        options
      }
    });
    return ref.afterClosed();
  }
}
