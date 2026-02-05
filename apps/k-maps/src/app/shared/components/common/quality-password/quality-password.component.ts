import { Component, Input } from '@angular/core';
import { McitLevelQualityPassword, McitPasswordService } from '../services/password.service';

@Component({
  selector: 'mcit-quality-password',
  templateUrl: './quality-password.component.html',
  styleUrls: ['./quality-password.component.scss']
})
export class McitQualityPasswordComponent {
  level = McitLevelQualityPassword.TooShort;
  messageKey = 'QUALITY-PASSWORD_COMPONENT.TOO_SHORT';

  @Input()
  set password(passsword: string) {
    this.level = this.passwordService.getLevelQualityPassword(passsword);
    this.messageKey = this.getQualityPasswordMessage();
  }

  constructor(private passwordService: McitPasswordService) {}

  private getQualityPasswordMessage(): string {
    switch (this.level) {
      case McitLevelQualityPassword.TooShort:
        return 'QUALITY-PASSWORD_COMPONENT.TOO_SHORT';
      case McitLevelQualityPassword.TooWeak:
        return 'QUALITY-PASSWORD_COMPONENT.TOO_WEAK';
      case McitLevelQualityPassword.Average:
        return 'QUALITY-PASSWORD_COMPONENT.AVERAGE';
    }
    return 'QUALITY-PASSWORD_COMPONENT.GOOD';
  }
}
