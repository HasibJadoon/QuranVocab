import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SearchAddressModalComponent } from './search-address-modal.component';
import { McitDialog } from '@lib-shared/common/dialog/dialog.service';

@Injectable()
export class SearchAddressModalService {
  constructor(private dialog: McitDialog) {}

  searchAddress(): Observable<any> {
    const ref = this.dialog.open<SearchAddressModalComponent, any, any>(SearchAddressModalComponent, {
      dialogClass: 'modal-lg modal-no-background',
      data: {}
    });
    return ref.afterClosed();
  }
}
