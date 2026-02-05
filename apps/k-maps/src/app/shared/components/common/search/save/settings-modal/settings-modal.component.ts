import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { McitDialogRef } from '../../../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../../../dialog/dialog.service';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { McitSearchSettingsService } from '../../search-settings.service';
import { Subscription } from 'rxjs';
import { IFiltersConfig, ISearchOptions } from '../../search-options';
import { McitFiltersService } from '../../filters/filters.service';
import * as lodash from 'lodash';

@Component({
  selector: 'mcit-settings-search-modal',
  templateUrl: './settings-modal.component.html',
  styleUrls: ['./settings-modal.component.scss']
})
export class McitSettingsModalComponent implements OnInit, OnDestroy {
  searchOptions: ISearchOptions;
  filtersConfig: IFiltersConfig;

  groupForm: UntypedFormGroup;

  private subscriptions: Subscription[] = [];

  constructor(
    private dialogRef: McitDialogRef<McitSettingsModalComponent>,
    private formBuilder: UntypedFormBuilder,
    private searchSettingsService: McitSearchSettingsService,
    @Inject(MCIT_DIALOG_DATA) data: any,
    private filtersService: McitFiltersService
  ) {
    this.searchOptions = data.searchOptions;
    this.filtersConfig = lodash.get(this.searchOptions.filters, 'filtersConfig');

    const filters = this.filtersConfig
      ? Object.keys(this.filtersConfig).reduce((acc, v) => {
          acc[v] = this.formBuilder.group({
            visibility: [null],
            defaultValue: [null]
          });
          return acc;
        }, {})
      : {};

    this.groupForm = this.formBuilder.group({
      filtersDisplayMode: [null],
      saveDisplayMode: [null],
      filters: this.formBuilder.group(filters)
    });
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.searchSettingsService.settings$(this.searchOptions.save.id).subscribe((next) => {
        this.groupForm.patchValue(next, {
          emitEvent: false
        });
      })
    );

    this.subscriptions.push(
      this.groupForm.valueChanges.subscribe((next) => {
        this.searchSettingsService.settings(this.searchOptions.save.id, next);
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
    this.searchSettingsService.reset(this.searchOptions.save.id);
  }

  /**
   * Edit la valeur par defaut
   */
  doEditDefaultValue(menuButton: any, key: string): void {
    this.filtersService
      .showFilter(
        menuButton,
        this.searchOptions,
        {
          [key]: this.groupForm.get(`filters.${key}.defaultValue`).value
        },
        key
      )
      .subscribe((next) => {
        if (next) {
          const value = next[key];

          this.groupForm.get(`filters.${key}.defaultValue`).setValue(value);
        }
      });
  }

  /**
   * Efface la valeur par defaut
   */
  doClearDefaultValue(key: string): void {
    this.groupForm.get(`filters.${key}.defaultValue`).setValue(null);
  }
}
