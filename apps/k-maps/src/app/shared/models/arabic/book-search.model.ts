export type BookSearchMode = 'sources' | 'pages' | 'toc' | 'index' | 'chunks' | 'evidence' | 'lexicon' | 'reader';

export type BookSearchSource = {
  source_code: string;
  title: string;
  author: string | null;
  publication_year: number | null;
  language: string | null;
  type: string;
  chunk_count: number;
};

export type BookSearchChunkHit = {
  chunk_id: string;
  source_code: string;
  page_no: number | null;
  locator: string | null;
  heading_raw: string | null;
  heading_norm: string | null;
  chunk_type: string;
  hit: string | null;
  rank: number | null;
};

export type BookSearchPageRow = {
  chunk_id: string;
  source_code: string;
  page_no: number | null;
  heading_raw: string | null;
  heading_norm: string | null;
  locator: string | null;
};

export type BookSearchTocRow = {
  toc_id: string;
  source_code: string;
  depth: number;
  index_path: string;
  title_raw: string;
  title_norm: string;
  page_no: number | null;
  locator: string | null;
  pdf_page_index: number | null;
  target_chunk_id: string | null;
};

export type BookSearchIndexRow = {
  index_id: string;
  source_code: string;
  term_raw: string;
  term_norm: string;
  term_ar: string | null;
  term_ar_guess: string | null;
  head_chunk_id: string | null;
  index_page_no: number | null;
  index_locator: string | null;
  page_refs_json: string;
  variants_json: string | null;
  target_chunk_id: string | null;
};

export type BookSearchEvidenceHit = {
  ar_u_lexicon: string;
  chunk_id: string | null;
  source_code: string;
  page_no: number | null;
  heading_raw: string | null;
  heading_norm: string | null;
  link_role: string;
  extract_hit: string | null;
  notes_hit: string | null;
  rank: number | null;
};

export type BookSearchLexiconEvidence = {
  source_code: string;
  title: string;
  chunk_id: string | null;
  page_no: number | null;
  extract_text: string | null;
  notes: string | null;
};

export type BookSearchResponse<T> = {
  ok: boolean;
  mode: BookSearchMode;
  total: number;
  limit: number;
  offset: number;
  results: T[];
};

export type BookSearchReaderChunk = {
  chunk_id: string;
  page_no: number | null;
  page_to?: number | null;
  heading_raw: string | null;
  locator: string | null;
  chunk_type: string | null;
  text: string;
  source_code: string;
  source_title: string;
  reader_scope?: 'page' | 'toc';
  toc_id?: string | null;
};

export type BookSearchReaderNav = {
  prev_chunk_id: string | null;
  prev_page_no: number | null;
  next_chunk_id: string | null;
  next_page_no: number | null;
  prev_toc_id?: string | null;
  next_toc_id?: string | null;
};

export type BookSearchReaderResponse = {
  ok: boolean;
  mode: 'reader';
  chunk: BookSearchReaderChunk | null;
  nav: BookSearchReaderNav;
};

export type BookSearchChunkUpdatePayload = {
  chunk_id: string;
  page_no?: number | null;
  heading_raw?: string | null;
  heading_norm?: string | null;
  locator?: string | null;
  chunk_type?: string | null;
  text?: string;
};

export type BookSearchChunkUpdateResponse = {
  ok: boolean;
  saved: boolean;
  chunk: BookSearchReaderChunk | null;
  nav: BookSearchReaderNav;
};

export type BookScrollReaderChunk = {
  chunk_id: string;
  heading_raw: string | null;
  text_raw: string;
  order_index: number;
};

export type BookScrollReaderPage = {
  page_no: number;
  pdf_page_index: number | null;
  chunks: BookScrollReaderChunk[];
};

export type BookScrollReaderRangeResponse = {
  source_id: string;
  start: number;
  limit: number;
  pages: BookScrollReaderPage[];
  has_more: boolean;
  next_start: number | null;
};
