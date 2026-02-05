import { NavigationExtras } from '@angular/router';

export interface IChatLocalNotification {
  title: string;
  text: string;
  foreground: boolean;
  icon: boolean;
  customData: ICustomNotificationData;
}

export interface ICustomNotificationData {
  redirect: boolean;
  commands?: string[];
  navigExtras?: NavigationExtras;
}
