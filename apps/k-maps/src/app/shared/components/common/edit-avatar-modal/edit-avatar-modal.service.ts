import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitEditAvatarModalComponent } from './edit-avatar-modal.component';
import { McitDialog } from '../dialog/dialog.service';
import { McitEditAvatarModalModule } from './edit-avatar-modal.module';

@Injectable()
export class McitEditAvatarModalService {
  constructor(private dialog: McitDialog) {}

  editAvatar(data: any): Observable<any> {
    const ref = this.dialog.open(McitEditAvatarModalComponent, {
      dialogClass: 'modal-dialog-centered',
      data: {
        data
      }
    });
    return ref.afterClosed();
  }
}
