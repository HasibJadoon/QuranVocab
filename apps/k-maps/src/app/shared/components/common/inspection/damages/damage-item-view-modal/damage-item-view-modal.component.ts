import { Component, Inject } from '@angular/core';
import { McitDialogRef } from '../../../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../../../dialog/dialog.service';

import { IVehicleInspectionElement } from '../../inspection.model';
import { WheelPosition } from '../../../svg-vehicle-damages/svg-vehicle-damages.service';
import { IAttachment } from '../../../models/attachments.model';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';

@TraceErrorClass()
@Component({
  selector: 'mcit-damage-item-view-modal',
  templateUrl: './damage-item-view-modal.component.html',
  styleUrls: ['./damage-item-view-modal.component.scss']
})
export class McitDamageItemViewModalComponent {
  public damagedElement: IVehicleInspectionElement;
  public attachmentUrls: Array<string> = [];
  public attachmentLocals: Array<IAttachment> = [];
  public wheelPosition: WheelPosition;

  constructor(private dialogRef: McitDialogRef<McitDamageItemViewModalComponent>, @Inject(MCIT_DIALOG_DATA) data: any) {
    this.damagedElement = data.damagedElement;
    this.attachmentUrls = data.attachmentUrls;
    this.attachmentLocals = data.attachmentLocals;
    this.wheelPosition = data.wheelPosition;
  }

  doClose(): void {
    this.dialogRef.close();
  }
}
