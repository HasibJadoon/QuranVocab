import { Injectable } from '@angular/core';
import { McitLevelQualityPassword, McitPasswordService } from './password.service';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class McitPasswordValidatorService {
  constructor(private passwordService: McitPasswordService) {}

  public checkQualityPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const level = this.passwordService.getLevelQualityPassword(control.value);

      switch (level) {
        case McitLevelQualityPassword.TooShort:
          return { password_length: true };
        case McitLevelQualityPassword.TooWeak:
          return { password_family: true };
        case McitLevelQualityPassword.Average:
          return { password_score: true };
      }
      return null;
    };
  }
}
