import { Component, ElementRef, HostBinding, HostListener, OnDestroy, OnInit } from '@angular/core';
import { McitGlobalDialog } from '../../../dialog/global-dialog.service';
import { animate, AnimationEvent, state, style, transition, trigger } from '@angular/animations';
import { Observable } from 'rxjs';
import { IVersion, McitCheckVersionService } from '../../../check-version/check-version.service';

@Component({
  selector: 'mcit-menu-sidenav',
  templateUrl: './menu-sidenav.component.html',
  styleUrls: ['./menu-sidenav.component.scss'],
  animations: [
    trigger('sidenavContainer', [
      state('void, exit', style({ opacity: 0, transform: 'translateX(-100%)' })),
      state('enter', style({ transform: 'none' })),
      transition('* => enter', [animate('0.3s ease', style({ transform: 'none', opacity: 1 }))]),
      transition('* => void, * => exit', [animate('0.3s ease', style({ opacity: 0, transform: 'translateX(-100%)' }))])
    ]),
    trigger('sidenavBackdrop', [
      state('void, exit', style({ opacity: 0 })),
      state('enter', style({ transform: 'none' })),
      transition('* => enter', [animate('0.3s ease', style({ opacity: 1 }))]),
      transition('* => void, * => exit', [animate('0.3s ease', style({ opacity: 0 }))])
    ])
  ],
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    class: 'modal',
    style: 'display:none',
    tabindex: '-1',
    'aria-modal': 'true'
  }
})
export class McitMenuSidenavComponent implements OnInit, OnDestroy {
  @HostBinding('style.display')
  display: string;

  sidenav = false;
  state: 'void' | 'enter' | 'exit' = 'void';

  version$: Observable<IVersion>;

  private callback;

  constructor(private elementRef: ElementRef, private globalDialog: McitGlobalDialog, private checkVersionService: McitCheckVersionService) {}

  ngOnInit(): void {
    this.version$ = this.checkVersionService.version$();

    this.callback = () => {
      this.doCloseSidenav();
    };
  }

  ngOnDestroy(): void {
    if (this.sidenav) {
      this.sidenav = false;

      this.globalDialog.unregisterOtherModal(this.callback);

      this.globalDialog.resetScrollbar();
    }
  }

  doOpenSidenav(): void {
    this.display = 'block';
    this.sidenav = true;
    this.state = 'enter';

    this.globalDialog.registerOtherModal(this.callback);

    this.globalDialog.setScrollbar();
  }

  doCloseSidenav(): void {
    this.state = 'exit';
  }

  @HostListener('click', ['$event'])
  onClick(event: any): void {
    if (event.target !== this.elementRef.nativeElement) {
      return;
    }

    this.doCloseSidenav();
  }

  @HostListener('window:keydown.esc', ['$event'])
  onEsc(event: any): void {
    if (!this.sidenav) {
      return;
    }
    if (event.keyCode === 27) {
      event.preventDefault();
    }

    this.doCloseSidenav();
  }

  onAnimationDone(event: AnimationEvent): void {
    if (event.toState === 'exit') {
      this.display = 'none';

      if (this.sidenav) {
        this.sidenav = false;

        this.globalDialog.unregisterOtherModal(this.callback);

        this.globalDialog.resetScrollbar();
      }
    }
  }
}
