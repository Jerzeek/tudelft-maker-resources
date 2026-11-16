// Builds one small file with the searchable text of every page.
// The Search page downloads it and searches in the browser — no server needed.
import type { APIRoute } from 'astro';
import { getData, entryUrl } from '../lib/data';
import { COLLECTIONS } from '../forms/vocab.mjs';

const plain = (markdown = '') =>
  markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`|~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const GET = (async () => {
  const data = await getData();
  const titles = (map: Map<string, { data: { title: string } }>, refs: { id: string }[]) =>
    refs.map((r) => map.get(r.id)?.data.title ?? '');
  const skillWords = (refs: { id: string }[]) =>
    data.pick(data.index.skills, refs as any).flatMap((s) => [s.data.title, ...s.data.aliases]);

  const docs = [
    ...data.spaces.map((e) => ({
      e,
      extra: [e.data.organisation, e.data.location.building, e.data.location.room, e.data.location.address, e.data.accessNotes, ...data.skillsOfSpace(e).flatMap((s) => [s.data.title, ...s.data.aliases]), ...data.equipmentIn(e.id).map((m) => m.data.title)],
    })),
    ...data.equipment.map((e) => ({
      e,
      extra: [e.data.model, data.index.spaces.get(e.data.space.id)!.data.title, e.data.trainingNotes, ...skillWords(e.data.skills)],
    })),
    ...data.skills.map((e) => ({ e, extra: e.data.aliases })),
    ...data.people.map((e) => ({ e, extra: [...skillWords(e.data.skills), ...data.spacesOfPerson(e.id).map((s) => s.data.title)] })),
    ...data.projects.map((e) => ({ e, extra: [e.data.credit, ...skillWords(e.data.skills), ...titles(data.index.equipment, e.data.equipment)] })),
  ].map(({ e, extra }) => ({
    type: e.collection,
    kind: COLLECTIONS[e.collection].singular,
    title: e.data.title,
    url: entryUrl(e),
    summary: e.data.summary ?? plain(e.body).slice(0, 160),
    keywords: extra.filter(Boolean).join(' '),
    text: plain(e.body).slice(0, 4000),
  }));

  return new Response(JSON.stringify(docs), { headers: { 'Content-Type': 'application/json' } });
}) satisfies APIRoute;
