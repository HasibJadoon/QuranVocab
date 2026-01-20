import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { discourseRelations } from '../discourse-mock';

@Component({
  selector: 'app-discourse-relation-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './discourse-relation-detail.component.html',
  styleUrls: ['./discourse-relation-detail.component.scss']
})
export class DiscourseRelationDetailComponent {
  relation = this.loadRelation();

  constructor(private readonly route: ActivatedRoute) {}

  private loadRelation() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    return discourseRelations[id];
  }

  relationLabel(status: 'align' | 'partial' | 'contradicts' | 'unknown') {
    switch (status) {
      case 'align':
        return 'Aligns';
      case 'partial':
        return 'Partial';
      case 'contradicts':
        return 'Contradicts';
      default:
        return 'Unknown';
    }
  }
}
