import { Routes } from '@angular/router';
import { LiteratureSectionListComponent } from './list/literature-section-list.component';
import { LiteratureSectionViewComponent } from './view/literature-section-view.component';
import { LiteratureSectionEditComponent } from './edit/literature-section-edit.component';
import { LiteratureSectionStudyComponent } from './study/literature-section-study.component';

export const literatureSectionRoutes: Routes = [
  { path: '', component: LiteratureSectionListComponent },
  { path: 'view/:sectionId', component: LiteratureSectionViewComponent },
  { path: 'edit/:sectionId', component: LiteratureSectionEditComponent },
  { path: 'study/:sectionId', component: LiteratureSectionStudyComponent }
];
