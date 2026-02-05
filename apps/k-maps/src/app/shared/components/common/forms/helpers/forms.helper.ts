import { AbstractControl, FormArray, FormGroup } from '@angular/forms';

namespace FormsHelper {
  /**
   * Recherche une erreur dans le control et les enfants
   */
  export function isExistControlError(control: AbstractControl): boolean {
    if (control instanceof FormGroup) {
      const group = control as FormGroup;
      for (const key in group.controls) {
        if (isExistControlError(group.controls[key])) {
          console.log(key);
          return true;
        }
      }
    } else if (control instanceof FormArray) {
      const array = control as FormArray;
      for (const item of array.controls) {
        if (isExistControlError(item)) {
          return true;
        }
      }
    }
    return !!control.errors;
  }
}

export default FormsHelper;
