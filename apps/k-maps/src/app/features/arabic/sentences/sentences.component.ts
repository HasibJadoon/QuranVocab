import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppHeaderbarComponent } from '../../../shared/components';

@Component({
  selector: 'app-arabic-sentences',
  standalone: true,
  imports: [CommonModule, AppHeaderbarComponent],
  templateUrl: './sentences.component.html',
  styleUrls: ['./sentences.component.scss'],
})
export class SentencesComponent {}
