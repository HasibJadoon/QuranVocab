import { NgModule } from '@angular/core';
import { McitNativeFileSystem } from '@lib-shared/common/file/native-file-system';
import { File } from '@awesome-cordova-plugins/file/ngx';

@NgModule({
  providers: [File, McitNativeFileSystem]
})
export class McitNativeFileSystemModule {}
