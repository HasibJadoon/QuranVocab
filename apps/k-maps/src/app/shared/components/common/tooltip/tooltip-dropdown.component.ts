import { AfterViewChecked, AfterViewInit, Component, ElementRef, Inject, OnChanges, OnInit, TemplateRef } from '@angular/core';
import { McitDropdownRef } from '../dropdown/dropdown-ref';
import { MCIT_DROPDOWN_DATA } from '../dropdown/dropdown.service';

@Component({
  selector: 'mcit-tooltip-dropdown',
  templateUrl: './tooltip-dropdown.component.html',
  styleUrls: ['./tooltip-dropdown.component.scss']
})
export class McitTooltipDropdownComponent implements OnInit {
  renderMethod: 'template' | 'text' = 'text';

  tooltipClass: string;
  position: string;
  size: string;

  message: string | TemplateRef<any>;
  context: any;

  constructor(private elementRef: ElementRef, private dropdownRef: McitDropdownRef<McitTooltipDropdownComponent>, @Inject(MCIT_DROPDOWN_DATA) data: any) {
    this.message = data.message;
    this.context = data.context;
    this.tooltipClass = data.tooltipClass || '';
    this.position = data.position || '';
    this.size = data.size;
  }

  ngOnInit(): void {
    if (this.message instanceof TemplateRef) {
      this.renderMethod = 'template';
    } else {
      this.renderMethod = 'text';
    }
  }
}
