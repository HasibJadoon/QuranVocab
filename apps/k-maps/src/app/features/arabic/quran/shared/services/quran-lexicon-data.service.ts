import { Injectable } from '@angular/core';

import { API_BASE } from '../../../../../shared/api-base';
import { AuthService } from '../../../../../shared/services/AuthService';

type PagedResponse<T> = {
  ok?: boolean;
  error?: string;
  total?: number;
  limit?: number;
  offset?: number;
  results?: T[];
};

type ItemResponse<T> = {
  ok?: boolean;
  error?: string;
  result?: T | null;
};

export interface QuranLexiconMorphologyLink {
  ar_u_lexicon: string;
  ar_u_morphology: string;
  link_role: string;
  created_at: string | null;
  surface_ar: string | null;
  surface_norm: string | null;
  pos2: string | null;
  derived_pattern: string | null;
  verb_form: string | null;
}

export interface QuranLexiconEvidenceRow {
  source_code: string;
  title: string;
  chunk_id: string | null;
  page_no: number | null;
  extract_text: string | null;
  notes: string | null;
}

export interface QuranMorphologyDetail {
  ar_u_morphology: string;
  canonical_input: string;
  surface_ar: string;
  surface_norm: string;
  pos2: string;
  derivation_type: string | null;
  noun_number: string | null;
  verb_form: string | null;
  derived_from_verb_form: string | null;
  derived_pattern: string | null;
  transitivity: string | null;
  obj_count: number | null;
  tags_ar: unknown;
  tags_en: unknown;
  notes: string | null;
  meta: unknown;
  created_at: string | null;
  updated_at: string | null;
}

export interface QuranLexiconBundle {
  lexiconId: string;
  morphologyLinks: QuranLexiconMorphologyLink[];
  evidenceRows: QuranLexiconEvidenceRow[];
  morphologyById: Record<string, QuranMorphologyDetail>;
}

@Injectable({ providedIn: 'root' })
export class QuranLexiconDataService {
  private readonly cache = new Map<string, Promise<QuranLexiconBundle>>();

  constructor(private readonly auth: AuthService) {}

  getLexiconBundle(lexiconId: string, options: { refresh?: boolean } = {}): Promise<QuranLexiconBundle> {
    const normalized = String(lexiconId ?? '').trim();
    if (!normalized) {
      return Promise.resolve({
        lexiconId: '',
        morphologyLinks: [],
        evidenceRows: [],
        morphologyById: {},
      });
    }

    if (options.refresh) {
      this.cache.delete(normalized);
    }

    const cached = this.cache.get(normalized);
    if (cached) return cached;

    const pending = this.loadBundle(normalized).catch((error: unknown) => {
      this.cache.delete(normalized);
      throw error;
    });
    this.cache.set(normalized, pending);
    return pending;
  }

  private async loadBundle(lexiconId: string): Promise<QuranLexiconBundle> {
    const [morphologyLinks, evidenceRows] = await Promise.all([
      this.fetchAllMorphologyLinks(lexiconId),
      this.fetchAllEvidenceRows(lexiconId),
    ]);

    const morphologyIds = Array.from(
      new Set(
        morphologyLinks
          .map((row) => String(row.ar_u_morphology ?? '').trim())
          .filter((id) => id.length > 0)
      )
    );
    const morphologyById = await this.fetchMorphologyByIds(morphologyIds);

    return {
      lexiconId,
      morphologyLinks,
      evidenceRows,
      morphologyById,
    };
  }

  private async fetchAllMorphologyLinks(lexiconId: string): Promise<QuranLexiconMorphologyLink[]> {
    return this.fetchAllPages<QuranLexiconMorphologyLink>(
      (limit, offset) =>
        this.fetchJson<PagedResponse<QuranLexiconMorphologyLink>>(
          `${API_BASE}/ar/lexicon-morphology?ar_u_lexicon=${encodeURIComponent(lexiconId)}&limit=${limit}&offset=${offset}`
        ),
      200,
      2500
    );
  }

  private async fetchAllEvidenceRows(lexiconId: string): Promise<QuranLexiconEvidenceRow[]> {
    return this.fetchAllPages<QuranLexiconEvidenceRow>(
      (limit, offset) =>
        this.fetchJson<PagedResponse<QuranLexiconEvidenceRow>>(
          `${API_BASE}/ar/book-search?mode=lexicon&ar_u_lexicon=${encodeURIComponent(lexiconId)}&limit=${limit}&offset=${offset}`
        ),
      200,
      2500
    );
  }

  private async fetchAllPages<T>(
    fetchPage: (limit: number, offset: number) => Promise<PagedResponse<T>>,
    pageSize: number,
    maxRows: number
  ): Promise<T[]> {
    const rows: T[] = [];
    let offset = 0;
    let total = Number.POSITIVE_INFINITY;

    while (offset < total && rows.length < maxRows) {
      const page = await fetchPage(pageSize, offset);
      if (page.ok === false) {
        throw new Error(page.error ?? 'Request failed.');
      }

      const resultRows = Array.isArray(page.results) ? page.results : [];
      rows.push(...resultRows);

      const reportedTotal = Number(page.total);
      total = Number.isFinite(reportedTotal) ? reportedTotal : offset + resultRows.length;
      if (!resultRows.length) break;
      offset += resultRows.length;
      if (resultRows.length < pageSize) break;
    }

    if (rows.length > maxRows) {
      return rows.slice(0, maxRows);
    }
    return rows;
  }

  private async fetchMorphologyByIds(ids: string[]): Promise<Record<string, QuranMorphologyDetail>> {
    const byId: Record<string, QuranMorphologyDetail> = {};
    if (!ids.length) return byId;

    const settled = await Promise.all(
      ids.map(async (id) => {
        try {
          const payload = await this.fetchJson<ItemResponse<QuranMorphologyDetail>>(
            `${API_BASE}/ar/morphology?id=${encodeURIComponent(id)}`
          );
          if (payload.ok === false) return null;
          const record = payload.result;
          if (!record || typeof record !== 'object') return null;
          return { id, record };
        } catch {
          return null;
        }
      })
    );

    for (const entry of settled) {
      if (!entry) continue;
      byId[entry.id] = entry.record;
    }
    return byId;
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      headers: {
        ...this.auth.authHeaders(),
        'content-type': 'application/json',
      },
    });

    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      const errorMessage =
        (typeof payload['error'] === 'string' && payload['error']) ||
        (typeof payload['message'] === 'string' && payload['message']) ||
        `Request failed (${response.status})`;
      throw new Error(errorMessage);
    }

    return payload as T;
  }
}
