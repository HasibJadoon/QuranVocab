import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { McitDialogRef } from '../../../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../../../dialog/dialog.service';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ICategoriesConfig, IFacetOptions } from '../../facet-options';
import { McitFacetSettingsService } from '../../facet-settings.service';
import * as lodash from 'lodash';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'mcit-settings-facet-modal',
  templateUrl: './settings-modal.component.html',
  styleUrls: ['./settings-modal.component.scss']
})
export class McitSettingsModalComponent implements OnInit, OnDestroy {
  facetOptions: IFacetOptions;
  categoriesConfig: ICategoriesConfig;

  groupForm: UntypedFormGroup;

  private subscriptions: Subscription[] = [];

  constructor(private dialogRef: McitDialogRef<McitSettingsModalComponent>, private formBuilder: UntypedFormBuilder, private facetSettingsService: McitFacetSettingsService, @Inject(MCIT_DIALOG_DATA) data: any) {
    this.facetOptions = data.facetOptions;
    this.categoriesConfig = lodash.get(this.facetOptions.categories, 'categoriesConfig');

    const categories = this.categoriesConfig
      ? Object.keys(this.categoriesConfig).reduce((acc, v) => {
          acc[v] = this.formBuilder.group({
            visibility: [null]
          });
          return acc;
        }, {})
      : {};
    const positions = this.categoriesConfig ? Object.keys(this.categoriesConfig) : [];

    this.groupForm = this.formBuilder.group({
      saveDisplayMode: [null],
      categories: this.formBuilder.group(categories),
      positions: [positions]
    });
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.facetSettingsService.settings$(this.facetOptions.save.id).subscribe((next) => {
        const positions = next.positions ?? [];
        const defaultPositions = this.categoriesConfig ? Object.keys(this.categoriesConfig) : [];

        const rest = lodash.difference(defaultPositions, positions);

        this.groupForm.patchValue(
          {
            ...next,
            positions: [...positions, ...rest]
          },
          {
            emitEvent: false
          }
        );
      })
    );

    this.subscriptions.push(
      this.groupForm.valueChanges.subscribe((next) => {
        this.facetSettingsService.settings(this.facetOptions.save.id, next);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  /**
   * Ferme la modal
   */
  doClose(): void {
    this.dialogRef.close();
  }

  /**
   * Efface les settings
   */
  doReset(): void {
    this.facetSettingsService.reset(this.facetOptions.save.id);
  }

  doDrop(event: CdkDragDrop<any>): void {
    const positions = this.groupForm.get('positions').value;

    console.log(positions);

    moveItemInArray(positions, event.previousIndex, event.currentIndex);

    console.log(positions);

    this.groupForm.get('positions').setValue(positions);
  }
}
