import { NgModule } from '@angular/core';
import { McitPlanningService } from './planning.service';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [CommonModule],
  providers: [McitPlanningService]
})
export class McitPlanningModule {}
