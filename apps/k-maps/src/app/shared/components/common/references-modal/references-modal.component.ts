import { AfterViewInit, Component, Inject } from '@angular/core';
import { from } from 'rxjs';
import { McitPopupService } from '../services/popup.service';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';
import { IOptions } from './references-modal.service';

@Component({
  selector: 'mcit-references-modal',
  templateUrl: './references-modal.component.html',
  styleUrls: ['./references-modal.component.scss']
})
export class McitReferencesModalComponent implements AfterViewInit {
  codeMirrorOptions = {
    lineNumbers: true,
    theme: 'default',
    readOnly: true
  };

  text = '';

  references: string[];
  options?: IOptions;

  constructor(
    private popupService: McitPopupService,
    private dialogRef: McitDialogRef<McitReferencesModalComponent, void>,
    @Inject(MCIT_DIALOG_DATA)
    data: {
      references: string[];
      options?: IOptions;
    }
  ) {
    this.references = data.references ?? [];
    this.options = data.options;

    this.text = data.references?.join('\n') ?? '';
  }

  ngAfterViewInit(): void {
    if (!this.options?.disableAutoCopy) {
      this.doCopy();
    }
  }

  doCopy() {
    from(navigator.clipboard.writeText(this.text)).subscribe(
      () => {
        this.popupService.showSuccess('REFERENCES_MODAL.COPY_IN_CLIPBOARD_REFERENCES', {
          messageParams: {
            num: this.references.length
          }
        });
      },
      (err) => {
        console.log(err);
        // this.popupService.showError();
      }
    );
  }

  doClose(): void {
    this.dialogRef.close();
  }
}
