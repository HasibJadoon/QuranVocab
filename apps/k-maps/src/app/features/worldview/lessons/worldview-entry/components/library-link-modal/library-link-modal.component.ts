import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-library-link-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './library-link-modal.component.html',
  styleUrls: ['./library-link-modal.component.scss'],
})
export class LibraryLinkModalComponent {
  @Output() close = new EventEmitter<void>();
  libraryItems = [
    { id: 7, name: 'North Press' },
    { id: 12, name: 'Oxford Forum' },
    { id: 21, name: 'Civic Debates' },
  ];
}
