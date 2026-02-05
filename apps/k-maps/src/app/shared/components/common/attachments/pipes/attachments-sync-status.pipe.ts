import { Pipe, PipeTransform } from '@angular/core';
import { IAction, IAttachment } from '../../models/attachments.model';
import { OfflineActionStatus } from '../../models/domains/offline-action-status.domain';

@Pipe({ name: 'attachSyncStatus' })
export class McitAttachmentsSyncStatusPipe implements PipeTransform {
  constructor() {}

  transform(actions: IAction[], attach: IAttachment): OfflineActionStatus {
    if (!actions?.length) {
      return OfflineActionStatus.DONE;
    }
    const syncAction = actions.filter((a) => ['addVehiclePicture', 'deleteVehiclePicture', 'addAttachment'].indexOf(a?.action_name) > -1).find((a) => a?.picture_sync_id && a.picture_sync_id === attach?.sync_id);
    return syncAction?.status ?? OfflineActionStatus.DONE;
  }
}
