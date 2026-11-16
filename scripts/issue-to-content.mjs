// ─────────────────────────────────────────────────────────────────────────────
// The "submission robot". Run by .github/workflows/submission.yml whenever
// somebody sends in a form. It reads the issue, writes the new page into
// src/content, and leaves notes for the maintainer who reviews it.
//
//   node scripts/issue-to-content.mjs --issue 12 --out /tmp/result
//   node scripts/issue-to-content.mjs --file issue.json --out /tmp/result   (for testing; no network)
//
// It writes into the --out folder:
//   result.json   { ok, branch, title, files }
//   pr-body.md    text for the pull request   (when ok)
//   comment.md    text for a comment on the issue
// ─────────────────────────────────────────────────────────────────────────────
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { buildEntry, formForLabels, parseIssueBody, renderEntry } from './lib/submission.mjs';
import { COLLECTIONS } from '../src/forms/vocab.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
};
const out = arg('out') ?? join(root, '.submission');
mkdirSync(out, { recursive: true });

// ── 1. Get the issue ─────────────────────────────────────────────────────────
let issue;
if (arg('file')) {
  issue = JSON.parse(readFileSync(arg('file'), 'utf8'));
} else {
  const number = arg('issue');
  if (!/^\d+$/.test(number ?? '')) throw new Error('Pass the issue number: --issue 12');
  issue = JSON.parse(
    execFileSync('gh', ['api', `repos/${process.env.GITHUB_REPOSITORY}/issues/${number}`], { encoding: 'utf8' }),
  );
}
const labels = (issue.labels ?? []).map((l) => (typeof l === 'string' ? l : l.name));
const finish = (result, files) => {
  for (const [name, text] of Object.entries(files)) writeFileSync(join(out, name), text);
  writeFileSync(join(out, 'result.json'), JSON.stringify(result, null, 2));
  console.log(result.ok ? `✔ Wrote ${result.files.join(', ')}` : `✖ ${result.reason}`);
  process.exit(0);
};
const sorry = (reason) =>
  finish(
    { ok: false, reason },
    {
      'comment.md':
        `Thank you for your submission! The automatic step could not turn it into a page:\n\n> ${reason}\n\n` +
        'Nothing is lost — a maintainer will take it from here.',
    },
  );

const form = formForLabels(labels);
if (!form) sorry('The issue does not have a label that says what kind of submission it is.');

// ── 2. Read what already exists, to link names to pages ──────────────────────
const existing = {};
for (const collection of Object.keys(COLLECTIONS)) {
  const dir = join(root, 'src/content', collection);
  existing[collection] = [];
  if (!existsSync(dir)) continue;
  for (const id of readdirSync(dir)) {
    const file = join(dir, id, 'index.md');
    if (!existsSync(file)) continue;
    const head = readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---/);
    const data = head ? parse(head[1]) : {};
    existing[collection].push({ id, title: String(data?.title ?? id), aliases: data?.aliases ?? [] });
  }
}

// ── 3. Build the page ────────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);
const entry = buildEntry({ form, answers: parseIssueBody(issue.body, form), existing, today });
if (!entry.ok) sorry(entry.error);

const folder = join(root, dirname(entry.path));
mkdirSync(folder, { recursive: true });
const files = [entry.path];

// ── 4. Fetch the photo, if one was attached ──────────────────────────────────
let image;
if (entry.photoUrl && !arg('file')) {
  try {
    const response = await fetch(entry.photoUrl, { redirect: 'follow', signal: AbortSignal.timeout(30_000) });
    const type = (response.headers.get('content-type') ?? '').split(';')[0];
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[type];
    if (!response.ok) throw new Error(`the download failed (${response.status})`);
    if (!ext) throw new Error(`it is not a JPEG, PNG, WebP or GIF image (${type || 'unknown type'})`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 15 * 1024 * 1024) throw new Error('it is larger than 15 MB');
    image = `photo.${ext}`;
    writeFileSync(join(folder, image), bytes);
    files.push(join(dirname(entry.path), image));
    entry.notes.push('A photo was added. Check that it may be published, write a proper `imageAlt` (what is on the photo?) and add an `imageCredit`.');
  } catch (error) {
    entry.notes.push(`The photo could not be added automatically: ${error.message}. Download it from the issue and add it by hand.`);
  }
}
writeFileSync(join(root, entry.path), renderEntry(entry, image));

// ── 5. Tell the humans ───────────────────────────────────────────────────────
const number = issue.number;
const checklist = entry.notes.length
  ? `### For the reviewer\n\n${entry.notes.map((n) => `- [ ] ${n}`).join('\n')}\n\n`
  : '';
finish(
  { ok: true, branch: `submission/issue-${number}`, title: `Add ${entry.kind}: ${entry.title}`, files },
  {
    'pr-body.md':
      `This page was prepared automatically from the submission in #${number}.\n\n` +
      `**New page:** \`${entry.path}\`\n\n` +
      checklist +
      '### Before you merge\n\n' +
      '- [ ] Read the page: is it correct, friendly and free of private information?\n' +
      '- [ ] Fix anything you like by editing the file in this pull request (the pencil icon under "Files changed").\n\n' +
      `Merging publishes the page within a few minutes.\n\nCloses #${number}\n`,
    'comment.md': 'Thank you! A draft page has been prepared from your submission. A maintainer will review it, and after that it goes live.',
  },
);
