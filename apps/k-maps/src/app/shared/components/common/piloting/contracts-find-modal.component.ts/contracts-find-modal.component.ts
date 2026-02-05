import { Component, OnInit, Inject } from '@angular/core';
import { IContract } from '@lib-shared/common/contract/contract.model';
import { IValuationTrspRoad } from '@lib-shared/common/models/valuate.model';
import { MCIT_DIALOG_DATA } from '@lib-shared/common/dialog/dialog.service';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';

@Component({
  selector: 'app-contracts-find-modal',
  templateUrl: './contracts-find-modal.component.html',
  styleUrls: ['./contracts-find-modal.component.scss']
})
export class ContractsFindModalComponent implements OnInit {
  contracts: IContract[];
  valuationTrspRoad: IValuationTrspRoad;

  constructor(@Inject(MCIT_DIALOG_DATA) public modalData: { valuationTrspRoad: IValuationTrspRoad }, private dialogRef: McitDialogRef<ContractsFindModalComponent>) {}

  ngOnInit(): void {
    this.valuationTrspRoad = this.modalData.valuationTrspRoad;
  }

  goBack(): void {
    this.dialogRef.close();
  }
}
