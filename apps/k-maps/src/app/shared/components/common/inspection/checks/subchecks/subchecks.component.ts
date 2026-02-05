import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { IVehicleSubcheckQuestion } from '../../inspection.model';
import { IAction, IAttachment } from '../../../models/attachments.model';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';

@TraceErrorClass()
@Component({
  selector: 'mcit-subchecks',
  templateUrl: './subchecks.component.html',
  styleUrls: ['./subchecks.component.scss'],
  providers: []
})
export class McitSubchecksComponent {
  @Input() subcheckForm: UntypedFormGroup;
  @Input() environment;
  @Input() prefix_attach_url: string;
  @Input() suffix_attach_url: string;
  @Input() isEditable$: Observable<boolean>;
  @Input() forceA4 = false;
  @Input() baseUrl: string;
  @Input() localMode = false;
  @Input() localAttachmentsDirectoryName: string;
  @Input() actions$: Observable<IAction[]> = null;
  @Input() subcheckQuestion: IVehicleSubcheckQuestion;

  @Output() attachAdded = new EventEmitter<IAttachment>();
  @Output() checkPathChanged = new EventEmitter<string>();

  constructor() {}

  onAttachAdded(attach: IAttachment): void {
    this.attachAdded.emit(attach);
  }

  onCheckPathChanged(checkPath: string, childCheckPath: string) {
    this.checkPathChanged.emit(checkPath + childCheckPath);
  }

  doChangeCheckPath(checkPath: string) {
    this.checkPathChanged.emit(checkPath);
  }
}
