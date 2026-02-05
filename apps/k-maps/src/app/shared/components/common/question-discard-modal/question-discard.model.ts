export interface IMcitQuestionDiscardOptions {
  titleParams?: object;
  questionParams?: object;
  saveParams?: object;
  discardParams?: object;
  cancelParams?: object;
  disableClose?: boolean;
}
export enum McitQuestionDiscardParamsEnum {
  save = 'save',
  discard = 'discard',
  cancel = 'cancel'
}
