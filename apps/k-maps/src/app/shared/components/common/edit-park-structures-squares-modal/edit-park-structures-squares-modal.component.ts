import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';
import { IOptions } from './edit-park-structures-squares-modal.service';
import { IParkStructureSquare } from 'projects/compound/src/app/business/models/park-structure-square.model';

@Component({
  selector: 'mcit-edit-park-structures-squares-modal',
  templateUrl: './edit-park-structures-squares-modal.component.html',
  styleUrls: ['./edit-park-structures-squares-modal.component.scss']
})
export class McitEditParkStructureSquaresModalComponent implements OnInit {
  options: IOptions;
  textForm: UntypedFormGroup;
  displayRefs = true;
  isDisabled = true;
  private squares: IParkStructureSquare[];

  constructor(private dialogRef: McitDialogRef<McitEditParkStructureSquaresModalComponent, IParkStructureSquare[]>, private formBuilder: UntypedFormBuilder, @Inject(MCIT_DIALOG_DATA) data: any) {
    this.squares = data.squares;
    this.options = data.options;
    this.displayRefs = data.displayRefs !== false;
    this.isDisabled = data.isDisabled;

    this.textForm = this.formBuilder.group({
      squares: ['']
    });
  }

  private static removeLastEmpty(array: string[]): string[] {
    let i = array.length - 1;
    while (!array[i] && i >= 0) {
      i--;
    }
    if (i === array.length - 1) {
      return array;
    }
    if (i === -1) {
      return [];
    }
    return array.slice(0, i + 1);
  }

  ngOnInit(): void {}

  doSubmit(): void {
    if (!this.textForm.valid) {
      return;
    }
    const form = this.textForm.getRawValue();
    const squares = McitEditParkStructureSquaresModalComponent.removeLastEmpty(form.squares.split('\n'));
    const res = [];
    for (let i = 0; i < squares.length; i++) {
      var codes = squares[i].split('-');
      res.push(codes);
    }
    this.dialogRef.close(res);
  }

  doClose(): void {
    this.dialogRef.close();
  }

  clearModel(make: string[], model: string[]) {
    for (let i = 0; i < make.length; i++) {
      if (make[i] === '') {
        model[i] = '';
      }
    }
    if (make.length < model.length) {
      model = model.slice(0, make.length);
    }
    return model;
  }
}
