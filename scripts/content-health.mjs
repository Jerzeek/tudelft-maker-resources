// ─────────────────────────────────────────────────────────────────────────────
// A check-up of the content: which pages are getting old, which are nearly
// empty, and which links are dead. Run monthly by
// .github/workflows/content-health.yml, which posts the result as an issue.
//
//   npm run health                 report on pages (fast, no network)
//   npm run health -- --links      also test every external link
//   npm run health -- --out file   write the report to a file instead of the screen
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import site from '../site.config.mjs';
import { COLLECTIONS } from '../src/forms/vocab.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const flag = (name) => process.argv.includes(`--${name}`);
const option = (name) => (flag(name) ? process.argv[process.argv.indexOf(`--${name}`) + 1] : undefined);

// ── Read every page ──────────────────────────────────────────────────────────
const pages = [];
for (const collection of Object.keys(COLLECTIONS)) {
  const dir = join(root, 'src/content', collection);
  if (!existsSync(dir)) continue;
  for (const id of readdirSync(dir).sort()) {
    const file = join(dir, id, 'index.md');
    if (!existsSync(file)) continue;
    const text = readFileSync(file, 'utf8');
    const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    const data = match ? (parse(match[1]) ?? {}) : {};
    if (data.draft) continue;
    pages.push({ collection, id, data, body: match ? match[2] : text, path: `src/content/${collection}/${id}/index.md` });
  }
}

const limit = new Date();
limit.setMonth(limit.getMonth() - site.staleAfterMonths);
const reviewed = (p) => (p.data.lastReviewed ? new Date(p.data.lastReviewed) : null);
const edit = (p) => `[${p.data.title}](https://github.com/${site.repo}/edit/${site.branch}/${p.path})`;
const month = (d) => d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });

const stale = pages.filter((p) => reviewed(p) && reviewed(p) < limit).sort((a, b) => reviewed(a) - reviewed(b));
const undated = pages.filter((p) => !reviewed(p));
const thin = pages.filter((p) => p.body.trim().length < 120 && ['spaces', 'skills', 'projects'].includes(p.collection));
const noPhoto = pages.filter((p) => !p.data.image && ['spaces', 'projects'].includes(p.collection));

// ── Links ────────────────────────────────────────────────────────────────────
const broken = [];
const unsure = [];
if (flag('links')) {
  const found = new Map(); // url → pages that use it
  for (const p of pages) {
    const urls = new Set([
      p.data.website,
      p.data.bookingUrl,
      p.data.profileUrl,
      ...(p.data.links ?? []).map((l) => l.url),
      ...[...p.body.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]),
    ]);
    for (const url of urls) if (url) found.set(url, [...(found.get(url) ?? []), p]);
  }
  const check = async (url) => {
    for (const method of ['HEAD', 'GET']) {
      try {
        const res = await fetch(url, {
          method,
          redirect: 'follow',
          signal: AbortSignal.timeout(20_000),
          headers: { 'user-agent': 'Mozilla/5.0 (compatible; link-check)' },
        });
        if (res.ok) return 'ok';
        if ([404, 410].includes(res.status)) return 'broken';
        if (method === 'GET') return `answered ${res.status}`;
      } catch (error) {
        if (method === 'GET') return error.cause?.code === 'ENOTFOUND' ? 'broken' : 'did not answer';
      }
    }
  };
  for (const [url, users] of found) {
    const result = await check(url);
    if (result === 'broken') broken.push({ url, users });
    else if (result !== 'ok') unsure.push({ url, users, result });
  }
}

// ── Report ───────────────────────────────────────────────────────────────────
const section = (title, intro, lines) => (lines.length ? `## ${title} (${lines.length})\n\n${intro}\n\n${lines.join('\n')}\n\n` : '');
let report = `A monthly check-up of the ${pages.length} pages on the site, made on ${new Date().toISOString().slice(0, 10)}.\n` +
  'Tick a box when it is done; next month a fresh list replaces this one.\n\n';
report += section(
  'Dead links',
  'These links give "page not found". Find the new address, or remove the link.',
  broken.map((b) => `- [ ] ${b.url} — used on ${b.users.map(edit).join(', ')}`),
);
report += section(
  'Pages not checked for a while',
  `Last checked more than ${site.staleAfterMonths} months ago. Ask the staff of the place whether the page is still right, fix what changed, and set \`lastReviewed\` to today. Oldest first.`,
  stale.map((p) => `- [ ] ${edit(p)} · ${COLLECTIONS[p.collection].singular.toLowerCase()} · last checked ${month(reviewed(p))}`),
);
report += section(
  'Pages that are nearly empty',
  'These have little or no text. They are the best place for a new contributor to start.',
  thin.map((p) => `- [ ] ${edit(p)} · ${COLLECTIONS[p.collection].singular.toLowerCase()}`),
);
report += section('Pages without a photo', 'A photo of the place makes a page far more inviting.', noPhoto.map((p) => `- [ ] ${edit(p)}`));
report += section('Pages without a "last checked" date', 'Add `lastReviewed` to these pages.', undated.map((p) => `- [ ] ${edit(p)}`));
report += section(
  'Links that could not be tested',
  'Some websites refuse automatic visitors, so these are probably fine. Worth a click if you have a minute.',
  unsure.map((u) => `- ${u.url} (${u.result})`),
);
if (!broken.length && !stale.length && !thin.length && !noPhoto.length && !undated.length) report += 'Everything looks healthy. 🎉\n';

if (option('out')) writeFileSync(option('out'), report);
else console.log(report);
