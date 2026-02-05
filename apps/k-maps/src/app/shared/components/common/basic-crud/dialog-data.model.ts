import { PopUpKind } from './pop-up-kind.domain';

export interface DialogData<T> {
  element?: T;
  popUpKind?: PopUpKind;
}
