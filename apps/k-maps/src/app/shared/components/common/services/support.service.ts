import { Injectable, OnDestroy, Renderer2, RendererFactory2 } from '@angular/core';
import { from, Observable, Subscription } from 'rxjs';
import { McitEnvService } from './env.service';
import { switchMap } from 'rxjs/operators';

declare let lz_data: any;
declare let OverlayChatWidgetV2: any;

export enum UserDataKey {
  Custom0 = 0,
  Custom1 = 1,
  Custom2 = 2,
  Custom3 = 3,
  Custom4 = 4,
  Custom5 = 5,
  Custom6 = 6,
  Custom7 = 7,
  Custom8 = 8,
  Custom9 = 9,
  Name = 111,
  Email = 112,
  Company = 113,
  Phone = 116
}

@Injectable({ providedIn: 'root' })
export class McitSupportService implements OnDestroy {
  private renderer: Renderer2;
  private showing = true;
  private subscriptions: Subscription[] = [];

  constructor(private envService: McitEnvService, private rendererFactory: RendererFactory2) {
    window['lz_data'] = {
      overwrite: false,
      0: '',
      1: '',
      2: '',
      3: '',
      4: '',
      5: '',
      6: '',
      7: '',
      8: '',
      9: '',
      111: '',
      112: '',
      113: '',
      116: ''
    };

    this.renderer = rendererFactory.createRenderer(null, null);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((data) => data.unsubscribe());
  }

  initSupport(): void {
    this.subscriptions.push(
      this.envService
        .env$()
        .pipe(switchMap((env) => this.loadSupportScript(env.supportBasePath || '//support.moveecar.io', env.supportId)))
        .subscribe(
          (env) => {},
          (err) => {
            console.error('Failed to load env.json');
          }
        )
    );
  }

  setUserProperty(key: UserDataKey, value: string): void {
    lz_data[key] = value || '';
    if (window['LiveZilla']) {
      window['LiveZilla'].SetData(lz_data);
    }
  }

  showSupport(): void {
    this.showing = true;
    const overlay = document.getElementById('lz_overlay_wm');
    if (overlay) {
      this.renderer.removeClass(overlay, 'd-none');
    }
  }

  hideSupport(): void {
    this.showing = false;
    const overlay = document.getElementById('lz_overlay_wm');
    if (overlay) {
      OverlayChatWidgetV2.Hide();
      this.renderer.addClass(overlay, 'd-none');
    } else {
      this.waiting();
    }
  }

  private waiting(): void {
    setTimeout(() => {
      if (!this.showing) {
        const overlay = document.getElementById('lz_overlay_wm');
        if (overlay) {
          OverlayChatWidgetV2.Hide();
          this.renderer.addClass(overlay, 'd-none');
        } else {
          this.waiting();
        }
      }
    }, 100);
  }

  private loadSupportScript(baseUrl: string, id: string): Observable<any> {
    return from(
      new Promise((resolve, reject) => {
        const element = document.createElement('script');
        element.setAttribute('type', 'text/javascript');
        element.setAttribute('id', id);
        element.defer = true;
        element.src = `${baseUrl}/livezilla/script.php?id=${id}`;
        element.onload = resolve;
        document.body.appendChild(element);
      })
    );
  }
}
