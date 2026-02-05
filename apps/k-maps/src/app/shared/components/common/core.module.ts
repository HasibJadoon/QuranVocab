import { ModuleWithProviders, NgModule, Optional, Provider, SkipSelf } from '@angular/core';

export interface McitCoreModuleConfig {
  env: Provider;
  config: Provider;
}

@NgModule({})
export class McitCoreModule {
  constructor(@Optional() @SkipSelf() parentModule: McitCoreModule) {
    if (parentModule) {
      throw new Error('McitCoreModule is already loaded. Import it in the AppModule only!');
    }
  }

  static forRoot(config: McitCoreModuleConfig): ModuleWithProviders<McitCoreModule> {
    return {
      ngModule: McitCoreModule,
      providers: [config.env, config.config]
    };
  }
}
