import { Component, OnInit, Inject } from '@angular/core';
import { McitDialogRef } from '../../../../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../../../../dialog/dialog.service';

const SAUT_DE_LIGNE = '\n';

const MAX_LINES = 155;

@Component({
  selector: 'mcit-stringlist-search-edit-modal',
  templateUrl: './filter-stringlist-edit-modal.component.html',
  styleUrls: ['./filter-stringlist-edit-modal.component.scss']
})
export class McitFilterStringlistEditModalComponent implements OnInit {
  objectKey: string;
  searchBox: string;

  constructor(private dialogRef: McitDialogRef<McitFilterStringlistEditModalComponent>, @Inject(MCIT_DIALOG_DATA) data: any) {
    this.searchBox = data.list ? data.list.join(SAUT_DE_LIGNE) : '';
    this.objectKey = data.objectKey;
  }

  ngOnInit(): void {
    this.setLimitsToText();
  }

  doApply(): void {
    this.setLimitsToText();
    this.dialogRef.close(
      this.searchBox
        ? this.searchBox
            .split(SAUT_DE_LIGNE)
            .map((l) => (l ? l.trim() : ''))
            .filter((v) => v && v.length > 0)
        : []
    );
  }

  doClear(): void {
    this.dialogRef.close([]);
  }

  doClose(): void {
    this.dialogRef.close();
  }

  getNbMaxLines(): number {
    return MAX_LINES;
  }

  getNbLines(): number {
    return this.searchBox.split(SAUT_DE_LIGNE).length;
  }

  isMaxLineReached(): boolean {
    return this.searchBox ? this.getNbLines() >= this.getNbMaxLines() : false;
  }

  onChange() {
    this.setLimitsToText();
  }

  private setLimitsToText() {
    const text_brut = this.searchBox ? this.searchBox : '';
    let lines = text_brut.split(SAUT_DE_LIGNE);
    if (lines.length > this.getNbMaxLines()) {
      lines = lines.slice(0, this.getNbMaxLines());
    }
    this.searchBox = lines.join(SAUT_DE_LIGNE);
  }
}
