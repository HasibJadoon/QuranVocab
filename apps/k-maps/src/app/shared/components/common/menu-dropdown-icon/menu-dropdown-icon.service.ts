// import { Injectable, ElementRef } from "@angular/core";
// import { McitDropdown } from "../dropdown/dropdown.service";

// @Injectable()
// export class McitMenuDropdownService {

//   constructor(
//     private dropdown: McitDropdown
//   ) {
//   }

//   chooseOptions(elementRef: ElementRef | HTMLElement, options: IOption[], code?: string, style?: any): Observable<string> {
//     const ref = this.dropdown.open<McitMenuDropdownComponent, any, string>(McitMenuDropdownComponent, elementRef, {
//       data: {
//         options: options,
//         code: code,
//         style: style
//       }
//     });
//     return ref.afterClosed();
//   }
// }
