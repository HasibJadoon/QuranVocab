import { ElementRef, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDropdown, Shape } from '../dropdown/dropdown.service';
import { IOption, McitMenuDropdownComponent } from './menu-dropdown.component';

@Injectable()
export class McitMenuDropdownService {
  constructor(private dropdown: McitDropdown) {}

  chooseOptions(elementRef: ElementRef | HTMLElement | Shape, options: IOption[], code?: string, style?: any): Observable<string> {
    const ref = this.dropdown.open<McitMenuDropdownComponent, any, string>(McitMenuDropdownComponent, elementRef, {
      data: {
        options,
        code,
        style
      }
    });
    return ref.afterClosed();
  }
}
