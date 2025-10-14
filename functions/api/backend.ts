type VocabRow = { id: number; root: string; lemma: string; front: string };

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env }) => {
  const res = await env.DB
    .prepare(`
      SELECT id, root, lemma, json_extract(data_json,'$.front') AS front
      FROM vocab
      LIMIT 10
    `)
    .all<VocabRow>();

  // res.results can be undefined in some typings, so default it
  const rows = res.results ?? [];
  return Response.json({ count: rows.length, rows });
};
