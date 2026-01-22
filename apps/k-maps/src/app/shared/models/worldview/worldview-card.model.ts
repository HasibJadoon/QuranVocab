/**
 * CANONICAL WORLDVIEW CARD
 * Matches `worldview_cards` table.
 * - A card is derived from a WorldviewClaim (claim-centric)
 * - card_json holds the full SRS/Anki payload
 */

export interface WorldviewCard {
  entity_type: 'worldview_card';
  id: number;

  user_id: number | null;

  claim_id: string;

  card: WorldviewCardPayload;

  notes: string | null;
  status: WorldviewCardStatus;

  created_at: string;
  updated_at: string | null;
}

export type WorldviewCardStatus = 'active' | 'archived';

export interface WorldviewCardPayload {
  card_id: string;
  card_type: WorldviewCardType;
  front: string;
  back: string;
  tags: string[];
  refs?: WorldviewCardRef[];
  extra?: Record<string, unknown>;
}

export type WorldviewCardType =
  | 'claim'
  | 'argument'
  | 'counterclaim'
  | 'definition'
  | 'comparison'
  | 'cloze';

export interface WorldviewCardRef {
  source_type: WorldviewCardSourceType;
  source_ref_id: string | null;
  ref_label: string | null;
  citation: string | null;
  locator: WorldviewCardLocator | null;
}

export type WorldviewCardSourceType =
  | 'library_entry'
  | 'book'
  | 'article'
  | 'paper'
  | 'speech'
  | 'lecture'
  | 'religious_text'
  | 'historical_text'
  | 'philosophy'
  | 'political_theory'
  | 'law'
  | 'other';

export interface WorldviewCardLocator {
  type: 'page' | 'section' | 'chapter' | 'paragraph' | 'timestamp' | 'url' | 'other';
  value: string;
}

export class WorldviewCardModel {
  constructor(public data: WorldviewCard) {}
}
