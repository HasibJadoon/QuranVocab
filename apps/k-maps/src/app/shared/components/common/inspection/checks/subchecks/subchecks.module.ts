import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitCommonModule } from '../../../common/common.module';
import { McitLayoutsModule } from '../../../layouts/layouts.module';
import { MatGridListModule } from '@angular/material/grid-list';
import { McitQuestionDiscardModalModule } from '../../../question-discard-modal/question-discard-modal.module';
import { McitImageViewerOverlayModule } from '../../../image-viewer-overlay/image-viewer-overlay.module';
import { McitSimpleAccordionModule } from '../../../simple-accordion/simple-accordion.module';
import { McitSimpleProgressModule } from '../../../simple-progress/simple-progress.module';
import { McitSubchecksComponent } from './subchecks.component';
import { McitSubcheckMultiAnswersComponent } from './subcheck-multi-answers/subcheck-multi-answers.component';
import { McitAttachmentsModule } from '../../../attachments/attachments.module';
import { McitSubcheckYesNoComponent } from './subcheck-yes-no/subcheck-yes-no.component';
import { McitSubcheckUniqueAnswerComponent } from './subcheck-unique-answer/subcheck-unique-answer.component';
import { Keyboard } from '@awesome-cordova-plugins/keyboard/ngx';
import { NgxLoadingModule } from 'ngx-loading';

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
    McitAttachmentsModule
  ],
  declarations: [McitSubchecksComponent, McitSubcheckYesNoComponent, McitSubcheckUniqueAnswerComponent, McitSubcheckMultiAnswersComponent],
  providers: [Keyboard],
  exports: [McitSubchecksComponent, McitSubcheckYesNoComponent, McitSubcheckUniqueAnswerComponent, McitSubcheckMultiAnswersComponent]
})
export class McitSubchecksModule {}
