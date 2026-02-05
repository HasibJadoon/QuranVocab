import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { McitDialogRef } from '../../../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../../../dialog/dialog.service';

@Component({
  selector: 'mcit-view-park-modal',
  templateUrl: './view-park-modal.component.html',
  styleUrls: ['./view-park-modal.component.scss']
})
export class ViewParkModalComponent implements OnInit, OnDestroy {
  park: any;
  agency: string;
  intern: boolean;

  constructor(private dialogRef: McitDialogRef<ViewParkModalComponent>, @Inject(MCIT_DIALOG_DATA) data: { park: any; agency: string; intern: boolean }) {
    this.park = data.park;
    this.agency = data.agency;
    this.intern = data.intern;
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  doClose(): void {
    this.dialogRef.close();
  }
}
