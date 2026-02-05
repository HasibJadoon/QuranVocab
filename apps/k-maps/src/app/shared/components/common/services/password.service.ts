import { Injectable } from '@angular/core';

declare let checkPassword;

const CONFIG = {
  passwordMinLength: 12,
  passwordMinFamily: 4,
  passwordMinScore: 50
};

export enum McitLevelQualityPassword {
  TooShort = 0,
  TooWeak,
  Average,
  Good
}

@Injectable({
  providedIn: 'root'
})
export class McitPasswordService {
  constructor() {}

  getLevelQualityPassword(password: string): McitLevelQualityPassword {
    if (password == null || password.length < CONFIG.passwordMinLength) {
      return McitLevelQualityPassword.TooShort;
    }

    const res = checkPassword(password);

    const nAlphaUC = res.nAlphaUC > 0 ? 1 : 0;
    const nAlphaLC = res.nAlphaLC > 0 ? 1 : 0;
    const nNumber = res.nNumber > 0 ? 1 : 0;
    const nSymbol = res.nSymbol > 0 ? 1 : 0;

    if (nAlphaUC + nAlphaLC + nNumber + nSymbol < CONFIG.passwordMinFamily) {
      return McitLevelQualityPassword.TooWeak;
    }

    if (res.nScore < CONFIG.passwordMinScore) {
      return McitLevelQualityPassword.Average;
    }

    return McitLevelQualityPassword.Good;
  }
}
