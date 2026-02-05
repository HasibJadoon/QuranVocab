import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitCommonModule } from '../../common/common.module';
import { McitLayoutsModule } from '../../layouts/layouts.module';
import { MatGridListModule } from '@angular/material/grid-list';
import { McitQuestionDiscardModalModule } from '../../question-discard-modal/question-discard-modal.module';
import { McitImageViewerOverlayModule } from '../../image-viewer-overlay/image-viewer-overlay.module';
import { McitSimpleAccordionModule } from '../../simple-accordion/simple-accordion.module';
import { McitSimpleProgressModule } from '../../simple-progress/simple-progress.module';
import { McitChecksComponent } from './checks.component';
import { McitCheckYesNoComponent } from './check-yes-no/check-yes-no.component';
import { McitCheckUniqueAnswerComponent } from './check-unique-answer/check-unique-answer.component';
import { McitCheckMultiAnswersComponent } from './check-multi-answers/check-multi-answers.component';
import { McitCheckFreeTextComponent } from './check-free-text/check-free-text.component';
import { McitCheckAttachmentComponent } from './check-attachment/check-attachment.component';
import { McitAttachmentsModule } from '../../attachments/attachments.module';
import { Keyboard } from '@awesome-cordova-plugins/keyboard/ngx';
import { McitOpenChecksPipe } from './pipes/open-checks.pipe';
import { McitSubchecksModule } from './subchecks/subchecks.module';
import { NgxLoadingModule } from 'ngx-loading';
import { McitObjectKeysPipe } from '@lib-shared/common/inspection/checks/pipes/object-keys.pipe';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    NgxLoadingModule,
    FormsModule,
    McitCommonModule,
    McitLayoutsModule,
    ReactiveFormsModule,
    MatGridListModule,
    McitQuestionDiscardModalModule,
    McitImageViewerOverlayModule,
    McitSimpleAccordionModule,
    McitSimpleProgressModule,
    McitAttachmentsModule,
    McitSubchecksModule
  ],
  declarations: [McitChecksComponent, McitCheckYesNoComponent, McitCheckUniqueAnswerComponent, McitCheckMultiAnswersComponent, McitCheckFreeTextComponent, McitCheckAttachmentComponent, McitOpenChecksPipe, McitObjectKeysPipe],
  providers: [Keyboard],
  exports: [McitChecksComponent, McitCheckYesNoComponent, McitCheckUniqueAnswerComponent, McitCheckMultiAnswersComponent, McitCheckFreeTextComponent, McitCheckAttachmentComponent]
})
export class McitChecksModule {}
