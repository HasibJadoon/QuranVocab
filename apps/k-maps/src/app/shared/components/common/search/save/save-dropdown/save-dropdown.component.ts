import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { McitDropdownRef } from '../../../dropdown/dropdown-ref';
import { MCIT_DROPDOWN_DATA } from '../../../dropdown/dropdown.service';
import ResizeSensor, { ResizeSensorCallback } from 'css-element-queries/src/ResizeSensor';
import { ISearchOptions } from '../../search-options';

@Component({
  selector: 'mcit-save-search-dropdown',
  templateUrl: './save-dropdown.component.html',
  styleUrls: ['./save-dropdown.component.scss']
})
export class McitSaveDropdownComponent implements OnInit, OnDestroy {
  @ViewChild('content', { static: true })
  content: ElementRef;

  searchOptions: ISearchOptions;

  private resizeSensor: ResizeSensor;
  private resizeSensorCallback: ResizeSensorCallback;

  constructor(private dropdownRef: McitDropdownRef<McitSaveDropdownComponent>, @Inject(MCIT_DROPDOWN_DATA) data: any) {
    this.searchOptions = data.searchOptions;
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

  doSelect(event: any): void {
    this.dropdownRef.close(event);
  }
}
