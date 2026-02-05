import { IActionOptions, IActionsConfig } from '../table/table-options';
import { Observable } from 'rxjs';

export enum TableActionKind {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  CLONE = 'CLONE',
  DELETE = 'DELETE',
  CODE = 'CODE',
  INFO = 'INFO',
  EXPORT = 'EXPORT'
}

interface TableActionArg<E> {
  fn: (item: E) => void;
  hidden: boolean | Observable<boolean>;
  kind: TableActionKind;
  disabled?: (element: E) => boolean;
}

export class TableActionsUtil {
  static getTableActions = <E>(...args: TableActionArg<E>[]): IActionOptions<E> => TableActionsUtil.getActions(args.map((arg) => TableActionsUtil.getConfig(arg)).reduce((cur, acc) => ({ ...cur, ...acc }), {}));

  static getTableActionsWithAdditionals = <E>(additionalActionConfig: IActionsConfig<E>, ...args: TableActionArg<E>[]): IActionOptions<E> =>
    TableActionsUtil.getActions({
      ...additionalActionConfig,
      ...args.map((arg) => TableActionsUtil.getConfig(arg)).reduce((cur, acc) => ({ ...cur, ...acc }), {})
    });

  static getConfig = <E>(arg: TableActionArg<E>): IActionsConfig<E> => {
    switch (arg.kind) {
      case TableActionKind.VIEW:
        return TableActionsUtil.CONFIG_VIEW(arg.fn, arg.hidden);
      case TableActionKind.EDIT:
        return TableActionsUtil.CONFIG_EDIT(arg.fn, arg.hidden);
      case TableActionKind.CLONE:
        return TableActionsUtil.CONFIG_CLONE(arg.fn, arg.hidden);
      case TableActionKind.EXPORT:
        return TableActionsUtil.CONFIG_EXPORT(arg.fn, arg.hidden);
      case TableActionKind.DELETE:
        return TableActionsUtil.CONFIG_DELETE(arg.fn, arg.hidden, arg.disabled);
      case TableActionKind.CODE:
        return TableActionsUtil.CONFIG_CODE(arg.fn, arg.hidden);
      case TableActionKind.INFO:
        return TableActionsUtil.CONFIG_INFO(arg.fn, arg.hidden);
    }
    return {};
  };

  static VIEW_EDIT_DELETE = <E>(
    viewFunction: (item: E) => void,
    viewHidden: boolean | Observable<boolean>,
    editFunction: (item: E) => void,
    editHidden: boolean | Observable<boolean>,
    deleteFunction: (item: E) => void,
    deleteHidden: boolean | Observable<boolean>
  ): IActionOptions<E> =>
    TableActionsUtil.getActions({
      ...TableActionsUtil.CONFIG_VIEW(viewFunction, viewHidden),
      ...TableActionsUtil.CONFIG_EDIT(editFunction, editHidden),
      ...TableActionsUtil.CONFIG_DELETE(deleteFunction, deleteHidden)
    });

  static VIEW_EDIT_CLONE_DELETE = <E>(
    viewFunction: (item: E) => void,
    viewHidden: boolean | Observable<boolean>,
    editFunction: (item: E) => void,
    editHidden: boolean | Observable<boolean>,
    cloneFunction: (item: E) => void,
    cloneHidden: boolean | Observable<boolean>,
    deleteFunction: (item: E) => void,
    deleteHidden: boolean | Observable<boolean>
  ): IActionOptions<E> =>
    TableActionsUtil.getActions({
      ...TableActionsUtil.CONFIG_VIEW(viewFunction, viewHidden),
      ...TableActionsUtil.CONFIG_EDIT(editFunction, editHidden),
      ...TableActionsUtil.CONFIG_CLONE(cloneFunction, cloneHidden),
      ...TableActionsUtil.CONFIG_DELETE(deleteFunction, deleteHidden)
    });

  static VIEW_EDIT_CODE_INFO = <E>(
    viewFunction: (item: E) => void,
    viewHidden: boolean | Observable<boolean>,
    editFunction: (item: E) => void,
    editHidden: boolean | Observable<boolean>,
    codeFunction: (item: E) => void,
    codeHidden: boolean | Observable<boolean>,
    infoFunction: (item: E) => void,
    infoHidden: boolean | Observable<boolean>
  ): IActionOptions<E> =>
    TableActionsUtil.getActions({
      ...TableActionsUtil.CONFIG_VIEW(viewFunction, viewHidden),
      ...TableActionsUtil.CONFIG_EDIT(editFunction, editHidden),
      ...TableActionsUtil.CONFIG_CODE(codeFunction, codeHidden),
      ...TableActionsUtil.CONFIG_INFO(infoFunction, infoHidden)
    });

  static VIEW_EDIT_INFO_DELETE = <E>(
    viewFunction: (item: E) => void,
    viewHidden: boolean | Observable<boolean>,
    editFunction: (item: E) => void,
    editHidden: boolean | Observable<boolean>,
    infoFunction: (item: E) => void,
    infoHidden: boolean | Observable<boolean>,
    deleteFunction: (item: E) => void,
    deleteHidden: boolean | Observable<boolean>
  ): IActionOptions<E> =>
    TableActionsUtil.getActions({
      ...TableActionsUtil.CONFIG_VIEW(viewFunction, viewHidden),
      ...TableActionsUtil.CONFIG_EDIT(editFunction, editHidden),
      ...TableActionsUtil.CONFIG_INFO(infoFunction, infoHidden),
      ...TableActionsUtil.CONFIG_DELETE(deleteFunction, deleteHidden)
    });

  static VIEW_EDIT_CODE_INFO_DELETE = <E>(
    viewFunction: (item: E) => void,
    viewHidden: boolean | Observable<boolean>,
    editFunction: (item: E) => void,
    editHidden: boolean | Observable<boolean>,
    codeFunction: (item: E) => void,
    codeHidden: boolean | Observable<boolean>,
    infoFunction: (item: E) => void,
    infoHidden: boolean | Observable<boolean>,
    deleteFunction: (item: E) => void,
    deleteHidden: boolean | Observable<boolean>
  ): IActionOptions<E> =>
    TableActionsUtil.getActions({
      ...TableActionsUtil.CONFIG_VIEW(viewFunction, viewHidden),
      ...TableActionsUtil.CONFIG_EDIT(editFunction, editHidden),
      ...TableActionsUtil.CONFIG_CODE(codeFunction, codeHidden),
      ...TableActionsUtil.CONFIG_INFO(infoFunction, infoHidden),
      ...TableActionsUtil.CONFIG_DELETE(deleteFunction, deleteHidden)
    });

  static CONFIG_VIEW = <E>(viewFunction: (item: E) => void, hidden: boolean | Observable<boolean> = false): IActionsConfig<E> => ({
    view: {
      icon: 'far fa-eye',
      nameKey: 'COMMON.DETAILS',
      cssClass: 'text-primary',
      action: (item) => viewFunction(item),
      hidden: () => hidden
    }
  });

  static CONFIG_EDIT = <E>(editFunction: (item: E) => void, hidden: boolean | Observable<boolean> = false): IActionsConfig<E> => ({
    edit: {
      icon: 'far fa-edit',
      nameKey: 'COMMON.EDIT',
      cssClass: 'text-primary',
      action: (item) => editFunction(item),
      hidden: () => hidden
    }
  });

  static CONFIG_CLONE = <E>(cloneFunction: (item: E) => void, hidden: boolean | Observable<boolean> = false): IActionsConfig<E> => ({
    clone: {
      icon: 'far fa-clone',
      nameKey: 'COMMON.CLONE',
      cssClass: 'text-primary',
      action: (item) => cloneFunction(item),
      hidden: () => hidden
    }
  });

  static CONFIG_EXPORT = <E>(exportFunction: (item: E) => void, hidden: boolean | Observable<boolean> = false): IActionsConfig<E> => ({
    export: {
      icon: 'far fa-file-export',
      nameKey: 'COMMON.EXPORT',
      cssClass: 'text-primary',
      action: (item) => exportFunction(item),
      hidden: () => hidden
    }
  });

  static CONFIG_INFO = <E>(infoFunction: (item: E) => void, hidden: boolean | Observable<boolean> = false): IActionsConfig<E> => ({
    info: {
      icon: 'far fa-info',
      nameKey: 'COMMON.INFO',
      cssClass: 'text-primary',
      action: (item) => infoFunction(item),
      hidden: () => hidden
    }
  });

  static CONFIG_CODE = <E>(codeFunction: (item: E) => void, hidden: boolean | Observable<boolean> = false): IActionsConfig<E> => ({
    code: {
      icon: 'far fa-code',
      nameKey: 'COMMON.OPEN_JSON',
      cssClass: 'text-primary',
      action: (item) => codeFunction(item),
      hidden: () => hidden
    }
  });

  static CONFIG_DELETE = <E>(deleteFunction: (item: E) => void, hidden: boolean | Observable<boolean> = false, disabled?: (item: E) => boolean): IActionsConfig<E> => ({
    delete: {
      icon: 'far fa-trash',
      nameKey: 'COMMON.DELETE',
      cssClass: 'text-danger',
      action: (item) => deleteFunction(item),
      hidden: () => hidden,
      disabled: (item) => disabled(item)
    }
  });

  private static getActions<E>(actionsConfig: IActionsConfig<E>): IActionOptions<E> {
    return {
      mode: 'column',
      actionsConfig,
      column: {
        type: 'auto',
        width: '94px'
      }
    };
  }
}
