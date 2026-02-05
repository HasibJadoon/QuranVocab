import { Component, Inject, OnInit } from '@angular/core';
import { McitDialogRef } from '../../../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../../../dialog/dialog.service';
import { IFacetOptions } from '../../facet-options';

@Component({
  selector: 'mcit-save-facet-modal',
  templateUrl: './save-modal.component.html',
  styleUrls: ['./save-modal.component.scss']
})
export class McitSaveModalComponent implements OnInit {
  facetOptions: IFacetOptions;

  constructor(private dialogRef: McitDialogRef<McitSaveModalComponent>, @Inject(MCIT_DIALOG_DATA) data: any) {
    this.facetOptions = data.facetOptions;
  }

  ngOnInit(): void {}

  doSelect(event: any): void {
    this.dialogRef.close(event);
  }
}
