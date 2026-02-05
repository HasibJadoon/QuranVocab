import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { COUNTRIES, Country } from '../models/country';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';
import { Subject, Subscription } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { debounceTime } from 'rxjs/operators';
import * as lodash from 'lodash';

@Component({
  selector: 'mcit-choose-country-modal',
  templateUrl: './choose-country-modal.component.html',
  styleUrls: ['./choose-country-modal.component.scss']
})
export class McitChooseCountryModalComponent implements OnInit, OnDestroy {
  codes: string[];

  options: Country[][];
  rest = 0;
  lastNb = 1;

  searchBox: string;
  querySubject = new Subject<string>();
  loading = false;

  private subscriptions: Subscription[] = [];

  constructor(private dialogRef: McitDialogRef<McitChooseCountryModalComponent, string[]>, @Inject(MCIT_DIALOG_DATA) data: { codes: string[] }, private breakpointObserver: BreakpointObserver) {
    this.codes = data.codes.map((code: string) => code.toUpperCase());
  }

  ngOnInit(): void {
    if (this.breakpointObserver.isMatched('(min-width: 992px)')) {
      this.buildOptions(3);
    } else if (this.breakpointObserver.isMatched('(min-width: 768px)')) {
      this.buildOptions(2);
    } else {
      this.buildOptions(1);
    }

    this.subscriptions.push(
      this.breakpointObserver.observe(['(min-width: 768px)', '(min-width: 992px)']).subscribe((next) => {
        if (next.breakpoints['(min-width: 992px)']) {
          this.buildOptions(3);
        } else if (next.breakpoints['(min-width: 768px)']) {
          this.buildOptions(2);
        } else {
          this.buildOptions(1);
        }
      })
    );

    this.subscriptions.push(
      this.querySubject
        .asObservable()
        .pipe(debounceTime(300))
        .subscribe((next) => {
          this.updateChange();
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((data) => data.unsubscribe());
  }

  private updateChange(): void {
    this.buildOptions(this.lastNb);
  }

  private buildOptions(nb: number): void {
    this.loading = true;
    this.lastNb = nb;

    let countries: Country[];
    if (this.searchBox) {
      const regexp = new RegExp(`${lodash.escapeRegExp(this.searchBox)}`, 'ig');
      countries = COUNTRIES.filter((c) => regexp.test(c.name) || regexp.test(c.code));
    } else {
      countries = COUNTRIES;
    }

    const finaltmp: Country[][] = [];
    let tmp: Country[] = [];
    for (const cp of countries) {
      tmp.push(cp);
      if (tmp.length === nb) {
        finaltmp.push(tmp);
        tmp = [];
      }
    }
    if (tmp.length > 0) {
      finaltmp.push(tmp);
      this.rest = nb - tmp.length;
    } else {
      this.rest = 0;
    }

    this.loading = false;
    this.options = finaltmp;
  }

  doChooseOption(option: Country): void {
    const index = this.codes.indexOf(option.code);

    if (index !== -1) {
      this.codes.splice(index, 1);
    } else {
      this.codes.push(option.code);
    }
  }

  doFinishSelection() {
    this.dialogRef.close(this.codes);
  }

  doClose(): void {
    this.dialogRef.close();
  }

  doClear(): void {
    this.searchBox = '';

    this.updateChange();
  }

  doSelectAll(): void {
    const cs = lodash.flatten(this.options.map((os) => os.map((o) => o.code)));

    this.codes = lodash.uniq(lodash.concat([], this.codes, cs));
  }

  doUnselectAll(): void {
    const cs = lodash.flatten(this.options.map((os) => os.map((o) => o.code as string)));

    this.codes = this.codes.filter((c) => cs.indexOf(c) === -1);
  }
}
