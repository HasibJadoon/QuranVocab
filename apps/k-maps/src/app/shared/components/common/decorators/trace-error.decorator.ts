import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { logError } from '@lib-shared/common/helpers/error.helper';

export function TraceErrorClass(returnValue?: any): ClassDecorator {
  return function traceErrors<TFunction extends Function>(ctr: TFunction): TFunction | void {
    Object.getOwnPropertyNames(ctr.prototype).forEach((name) => {
      let descriptor: PropertyDescriptor | void = Object.getOwnPropertyDescriptor(ctr.prototype, name);
      if (typeof descriptor.value === 'function') {
        descriptor = TraceError(returnValue)(ctr.prototype, name, descriptor);
        if (descriptor) {
          Object.defineProperty(ctr.prototype, name, descriptor);
        }
      }
    });
    return ctr;
  };
}

export function TraceError(returnValue?: any): MethodDecorator {
  return function (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor {
    const decorated: Function = descriptor.value;
    descriptor.value = function (...args: Array<any>) {
      try {
        const delegateResult = decorated.apply(this, args);
        if (delegateResult instanceof Observable) {
          return delegateResult.pipe(
            catchError((error) => {
              logError(`${decorated.name}`, { error, infos: args });
              if (returnValue !== undefined) {
                return of(returnValue);
              } else {
                throw error;
              }
            })
          );
        }
        return delegateResult;
      } catch (error) {
        logError(`${decorated.name}`, { error, infos: args });
        if (returnValue !== undefined) {
          return of(returnValue);
        } else {
          throw error;
        }
      }
    };
    return descriptor;
  };
}
