import { Pipe, PipeTransform } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '@lib-shared/common/auth/models/user.model';

@Pipe({
  name: 'rulesUserChatDispatcherCarrier'
})
export class McitRulesUserChatDispatcherCarrierPipe implements PipeTransform {
  constructor(private router: Router) {}

  transform(user: User | null): boolean {
    return user?.apps?.dispatcher?.roles?.includes('chat') && this.router.url.includes('carrier');
  }
}
