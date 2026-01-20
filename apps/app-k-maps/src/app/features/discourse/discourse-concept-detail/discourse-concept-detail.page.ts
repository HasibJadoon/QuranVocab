import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { discourseConcepts, DiscourseConcept } from '../discourse-mock';

@Component({
  selector: 'app-discourse-concept-detail',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './discourse-concept-detail.page.html',
  styleUrls: ['./discourse-concept-detail.page.scss'],
})
export class DiscourseConceptDetailPage {
  concept: DiscourseConcept | undefined;

  constructor(private readonly route: ActivatedRoute, private readonly router: Router) {
    const slug = this.route.snapshot.paramMap.get('slug');
    this.concept = discourseConcepts.find((item) => item.slug === slug);
  }

  openRelation(id: string) {
    this.router.navigate(['/discourse/relations', id]);
  }

  relationLabel(status: DiscourseConcept['relations'][number]['status']) {
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

  relationColor(status: DiscourseConcept['relations'][number]['status']) {
    switch (status) {
      case 'align':
        return 'success';
      case 'partial':
        return 'warning';
      case 'contradicts':
        return 'danger';
      default:
        return 'medium';
    }
  }
}
