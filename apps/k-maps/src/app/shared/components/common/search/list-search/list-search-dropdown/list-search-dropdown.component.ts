import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { McitDropdownRef } from '../../../dropdown/dropdown-ref';
import { MCIT_DROPDOWN_DATA } from '../../../dropdown/dropdown.service';
import ResizeSensor, { ResizeSensorCallback } from 'css-element-queries/src/ResizeSensor';
import { ISearchOptions } from '../../search-options';

@Component({
  selector: 'mcit-list-search-dropdown',
  templateUrl: './list-search-dropdown.component.html',
  styleUrls: ['./list-search-dropdown.component.scss']
})
export class McitListSearchDropdownComponent implements OnInit, OnDestroy {
  @ViewChild('content', { static: true })
  content: ElementRef;

  searchOptions: ISearchOptions;
  text: string;
  removeDuplicates: boolean;

  private resizeSensor: ResizeSensor;
  private resizeSensorCallback: ResizeSensorCallback;

  constructor(private dropdownRef: McitDropdownRef<McitListSearchDropdownComponent>, @Inject(MCIT_DROPDOWN_DATA) data: any) {
    this.searchOptions = data.searchOptions;
    this.text = data.text;
    this.removeDuplicates = data.removeDuplicates || true;
  }

  ngOnInit(): void {
    this.resizeSensorCallback = (size) => {
      this.dropdownRef.updatePosition();
    };
    this.resizeSensor = new ResizeSensor(this.content.nativeElement, this.resizeSensorCallback);
  }

  ngOnDestroy(): void {
    this.resizeSensor.detach(this.resizeSensorCallback);
  }

  doClose(): void {
    this.dropdownRef.close({ text: this.text });
  }
}
