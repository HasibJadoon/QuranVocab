import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';
import { IOptions, IVehicleId } from './edit-vehicle-ids-modal.service';

@Component({
  selector: 'mcit-edit-vehicle-ids-modal',
  templateUrl: './edit-vehicle-ids-modal.component.html',
  styleUrls: ['./edit-vehicle-ids-modal.component.scss']
})
export class McitEditVehicleIdsModalComponent implements OnInit {
  options: IOptions;
  textForm: UntypedFormGroup;
  displayRefs = true;
  isDisabled = true;
  private vehicleIds: IVehicleId[];

  constructor(private dialogRef: McitDialogRef<McitEditVehicleIdsModalComponent, IVehicleId[]>, private formBuilder: UntypedFormBuilder, @Inject(MCIT_DIALOG_DATA) data: any) {
    this.vehicleIds = data.vehicleIds;
    this.options = data.options;
    this.displayRefs = data.displayRefs !== false;
    this.isDisabled = data.isDisabled;

    this.textForm = this.formBuilder.group({
      vins: [''],
      x_vins: [''],
      license_plates: [''],
      maker: [''],
      model: ['']
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

  ngOnInit(): void {
    const res = this.vehicleIds.reduce(
      (acc, x) => {
        if (x) {
          acc.vins.push(x.vin);
          acc.x_vins.push(x.x_vin);
          acc.license_plates.push(x.license_plate);
          acc.maker.push(x.maker);
          acc.model.push(x.model);
        } else {
          acc.vins.push('');
          acc.x_vins.push('');
          acc.license_plates.push('');
          acc.maker.push('');
          acc.model.push('');
        }
        return acc;
      },
      { vins: [], x_vins: [], license_plates: [], maker: [], model: [] }
    );

    this.textForm.patchValue({
      vins: McitEditVehicleIdsModalComponent.removeLastEmpty(res.vins).join('\n'),
      x_vins: McitEditVehicleIdsModalComponent.removeLastEmpty(res.x_vins).join('\n'),
      license_plates: McitEditVehicleIdsModalComponent.removeLastEmpty(res.license_plates).join('\n'),
      maker: McitEditVehicleIdsModalComponent.removeLastEmpty(res.maker).join('\n'),
      model: McitEditVehicleIdsModalComponent.removeLastEmpty(res.model).join('\n')
    });
  }

  doSubmit(): void {
    if (!this.textForm.valid) {
      return;
    }

    const form = this.textForm.getRawValue();
    const vins = McitEditVehicleIdsModalComponent.removeLastEmpty(form.vins.split('\n'));
    const x_vins = McitEditVehicleIdsModalComponent.removeLastEmpty(form.x_vins.split('\n'));
    const license_plates = McitEditVehicleIdsModalComponent.removeLastEmpty(form.license_plates.split('\n'));
    const maker = McitEditVehicleIdsModalComponent.removeLastEmpty(form.maker.split('\n'));
    let model = McitEditVehicleIdsModalComponent.removeLastEmpty(form.model.split('\n'));
    const max = Math.max(vins.length, x_vins.length, license_plates.length, maker.length, model.length);

    model = this.clearModel(maker, model);

    const res: IVehicleId[] = [];
    for (let i = 0; i < max; i++) {
      res.push({
        vin: i < vins.length ? vins[i] : '',
        x_vin: i < x_vins.length ? x_vins[i] : '',
        license_plate: i < license_plates.length ? license_plates[i] : '',
        maker: i < maker.length ? maker[i] : '',
        model: i < model.length ? model[i] : ''
      });
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
