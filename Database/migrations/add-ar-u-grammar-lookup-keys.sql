ALTER TABLE ar_u_grammar
  ADD COLUMN lookup_keys_json JSON
  CHECK (lookup_keys_json IS NULL OR json_valid(lookup_keys_json));

ALTER TABLE ar_u_grammar
  ADD COLUMN canonical_norm TEXT;

CREATE INDEX IF NOT EXISTS idx_ar_u_grammar_canonical_norm
  ON ar_u_grammar(canonical_norm);

CREATE UNIQUE INDEX IF NOT EXISTS ux_ar_u_grammar_canonical_norm
  ON ar_u_grammar(canonical_norm)
  WHERE canonical_norm IS NOT NULL AND canonical_norm <> '';
