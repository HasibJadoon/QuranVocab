import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CropperDrawSettings, CropperSettings, ImageCropper, ImageCropperComponent } from 'ngx-img-cropper';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';

declare let ResizeSensor;

const IMAGE_SIZE = 128;

@Component({
  selector: 'mcit-edit-avatar-modal',
  templateUrl: './edit-avatar-modal.component.html',
  styleUrls: ['./edit-avatar-modal.component.scss']
})
export class McitEditAvatarModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('container', { static: true })
  container: ElementRef;
  @ViewChild('imageCropperComponent', { static: true })
  imageCropperComponent: ImageCropperComponent;

  data: any;
  cropperData: any = {};
  cropperSettings: CropperSettings;

  cropper: ImageCropper;

  private resizeSensors = [];
  private resizeSensorCallback = null;

  constructor(private dialogRef: McitDialogRef<McitEditAvatarModalComponent>, @Inject(MCIT_DIALOG_DATA) data: any) {
    this.data = data.data;
  }

  ngOnInit(): void {
    this.cropperSettings = new CropperSettings();
    this.cropperSettings.width = IMAGE_SIZE;
    this.cropperSettings.height = IMAGE_SIZE;
    this.cropperSettings.minWidth = IMAGE_SIZE;
    this.cropperSettings.minHeight = IMAGE_SIZE;
    this.cropperSettings.croppedWidth = IMAGE_SIZE;
    this.cropperSettings.croppedHeight = IMAGE_SIZE;
    this.cropperSettings.canvasWidth = 400;
    this.cropperSettings.canvasHeight = 300;
    this.cropperSettings.noFileInput = true;
    this.cropperSettings.cropperClass = '';
    this.cropperSettings.croppingClass = '';
    this.cropperSettings.dynamicSizing = false;
    this.cropperSettings.cropperDrawSettings = new CropperDrawSettings();
    this.cropperSettings.cropperDrawSettings.strokeColor = '#ffb612';
    this.cropperSettings.cropperDrawSettings.strokeWidth = 3;
    this.cropperSettings.showCenterMarker = false;

    this.cropper = new ImageCropper(this.cropperSettings);
  }

  ngAfterViewInit(): void {
    this.resizeSensorCallback = () => {
      this.updateSize();
    };
    this.resizeSensors.push(new ResizeSensor(this.container.nativeElement, this.resizeSensorCallback));

    this.updateSize();

    const image: any = new Image();
    image.src = this.data;
    this.imageCropperComponent.setImage(image);
  }

  ngOnDestroy(): void {
    this.resizeSensors.forEach((rs) => rs.detach(this.resizeSensorCallback));
  }

  doSave(): void {
    this.dialogRef.close(this.cropperData.image);
  }

  private updateSize() {
    const n = this.container.nativeElement;
    const w = n.offsetWidth > 0 ? n.offsetWidth : 300;
    this.cropperSettings.canvasWidth = w;
    this.cropperSettings.canvasHeight = 300;
    this.cropper.resizeCanvas(w, 300, true);
  }

  doClose(): void {
    this.dialogRef.close();
  }
}
