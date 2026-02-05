import { Component, Inject, OnInit } from '@angular/core';
import { McitDialogRef } from '../../../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../../../dialog/dialog.service';
import { ISearchOptions } from '../../search-options';

@Component({
  selector: 'mcit-save-search-modal',
  templateUrl: './save-modal.component.html',
  styleUrls: ['./save-modal.component.scss']
})
export class McitSaveModalComponent implements OnInit {
  searchOptions: ISearchOptions;

  constructor(private dialogRef: McitDialogRef<McitSaveModalComponent>, @Inject(MCIT_DIALOG_DATA) data: any) {
    this.searchOptions = data.searchOptions;
  }

  ngOnInit(): void {}

  doSelect(event: any): void {
    this.dialogRef.close(event);
  }
}
