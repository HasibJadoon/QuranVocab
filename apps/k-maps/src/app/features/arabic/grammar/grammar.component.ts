import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppHeaderbarComponent } from '../../../shared/components';

@Component({
  selector: 'app-arabic-grammar',
  standalone: true,
  imports: [CommonModule, AppHeaderbarComponent],
  templateUrl: './grammar.component.html',
  styleUrls: ['./grammar.component.scss'],
})
export class GrammarComponent {}
