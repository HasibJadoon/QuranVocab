import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { COUNTRIES, CountryPhone } from '../models/country';
import { getCountryCallingCode } from 'libphonenumber-js';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import * as lodash from 'lodash';

export interface IOptions {
  showAuto?: boolean;
}

@Component({
  selector: 'mcit-choose-country-phone-modal',
  templateUrl: './choose-country-phone-modal.component.html',
  styleUrls: ['./choose-country-phone-modal.component.scss']
})
export class McitChooseCountryPhoneModalComponent implements OnInit, OnDestroy {
  code: string;
  options: CountryPhone[][];
  rest = 0;
  lastNb = 1;

  searchBox: string;
  querySubject = new Subject<string>();
  loading = false;

  showAuto = false;

  private countryPhones: CountryPhone[] = [];
  private subscriptions: Subscription[] = [];

  constructor(private dialogRef: McitDialogRef<McitChooseCountryPhoneModalComponent, CountryPhone | string>, @Inject(MCIT_DIALOG_DATA) data: any, private breakpointObserver: BreakpointObserver) {
    this.code = data.code;
    this.showAuto = data.options?.showAuto || false;

    for (const cp of COUNTRIES) {
      this.countryPhones.push({
        code: cp.code,
        name: cp.name,
        indicatif: '+' + getCountryCallingCode(cp.code),
        flag: cp.flag
      });
    }
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
        console.log(next);
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

    let countries: CountryPhone[];
    if (this.searchBox) {
      const regexp = new RegExp(`${lodash.escapeRegExp(this.searchBox)}`, 'ig');
      countries = this.countryPhones.filter((c) => regexp.test(c.name) || regexp.test(c.code) || regexp.test(c.indicatif));
    } else {
      countries = this.countryPhones;
    }

    const finaltmp: CountryPhone[][] = [];
    let tmp: CountryPhone[] = [];
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

  doChooseOption(option: CountryPhone | string): void {
    this.dialogRef.close(option);
  }

  doClose(): void {
    this.dialogRef.close();
  }

  doClear(): void {
    this.searchBox = '';

    this.updateChange();
  }
}
