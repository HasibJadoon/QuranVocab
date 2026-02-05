import { Component, Inject, OnInit } from '@angular/core';
import { McitDropdownRef } from '../dropdown/dropdown-ref';
import { MCIT_DROPDOWN_DATA } from '../dropdown/dropdown.service';

export interface IOption {
  code: string;
  nameKey: string;
  params?: any;
  ellipse?: boolean;
  noTranslate?: boolean;
  icon?: string;
  disabled?: boolean;
  isHeader?: boolean;
  nameKeyBis?: string;
  paramsBis?: any;
  noTranslateBis?: boolean;
}

@Component({
  selector: 'mcit-menu-dropdown',
  templateUrl: './menu-dropdown.component.html',
  styleUrls: ['./menu-dropdown.component.scss']
})
export class McitMenuDropdownComponent implements OnInit {
  options: IOption[];
  code: string;
  style: any;

  constructor(private dropdownRef: McitDropdownRef<McitMenuDropdownComponent, string>, @Inject(MCIT_DROPDOWN_DATA) data: any) {
    this.options = data.options;
    this.code = data.code;
    this.style = data.style;
  }

  ngOnInit(): void {}

  doChooseOption(code: string): void {
    this.dropdownRef.close(code);
  }
}
