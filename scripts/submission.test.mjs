// Tests for the submission robot. Run with:  npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parse } from 'yaml';
import { FORMS, formById } from '../src/forms/definitions.mjs';
import { slugify } from '../src/forms/vocab.mjs';
import { buildEntry, cleanMarkdown, findEntry, formForLabels, parseIssueBody, renderEntry } from './lib/submission.mjs';

const existing = {
  spaces: [
    { id: 'ide-pmb', title: 'IDE PMB', aliases: [] },
    { id: 'ide-studiomake', title: 'IDE StudioMake', aliases: [] },
  ],
  equipment: [{ id: 'prusa-xl', title: 'Prusa XL', aliases: [] }],
  skills: [
    { id: '3d-printing', title: '3D printing', aliases: ['3d printer'] },
    { id: 'laser-cutting', title: 'Laser cutting', aliases: ['lasercutting'] },
  ],
  people: [{ id: 'don', title: 'Don', aliases: [] }],
  projects: [],
};
const today = '2026-01-15';

/** Write an issue body the way GitHub does for an issue form. */
const issueBody = (form, values) =>
  form.fields.map((f) => `### ${f.label}\n\n${values[f.id] ?? '_No response_'}`).join('\n\n');
const build = (formId, values) => {
  const form = formById(formId);
  return buildEntry({ form, answers: parseIssueBody(issueBody(form, values), form), existing, today });
};
const front = (entry, image) => parse(renderEntry(entry, image).split('---')[1]);

test('slugify makes web-safe ids', () => {
  assert.equal(slugify('IDE PMB (ground floor)'), 'ide-pmb-ground-floor');
  assert.equal(slugify('Café & Atelier'), 'cafe-and-atelier');
  assert.equal(slugify('../../etc/passwd'), 'etc-passwd');
  assert.equal(slugify('   '), '');
});

test('the form is chosen by the labels on the issue', () => {
  assert.equal(formForLabels(['submission', 'equipment']).id, 'equipment');
  assert.equal(formForLabels(['bug']), null);
  assert.equal(formForLabels(['correction']), null, 'corrections are handled by a person');
});

test('every form field has a unique id and label', () => {
  for (const form of FORMS) {
    assert.equal(new Set(form.fields.map((f) => f.id)).size, form.fields.length, `${form.id}: duplicate field id`);
    assert.equal(new Set(form.fields.map((f) => f.label)).size, form.fields.length, `${form.id}: duplicate label`);
    for (const f of form.fields) assert.match(f.id, /^[a-z][a-z0-9-]*$/, `${form.id}.${f.id}`);
  }
});

test('names are matched to existing pages', () => {
  assert.equal(findEntry('ide pmb', existing.spaces).id, 'ide-pmb');
  assert.equal(findEntry('PMB', existing.spaces).id, 'ide-pmb');
  assert.equal(findEntry('lasercutting', existing.skills).id, 'laser-cutting');
  assert.equal(findEntry('IDE', existing.spaces), null, 'ambiguous names match nothing');
  assert.equal(findEntry('', existing.spaces), null);
});

test('a makerspace submission becomes a valid page', () => {
  const entry = build('space', {
    name: 'Aerospace Student Workshop',
    summary: 'A workshop for\nAE students.',
    kind: 'Workshop',
    area: 'TU Delft campus',
    location: 'Kluyverweg 1, Delft',
    access: 'Own faculty only',
    website: 'https://example.org/workshop',
    skills: '3D printer, Lasercutting, Glass blowing',
    contacts: 'Don, Someone New',
    details: 'Bring your **own** material.',
  });
  assert.equal(entry.ok, true);
  assert.equal(entry.path, 'src/content/spaces/aerospace-student-workshop/index.md');
  const data = front(entry);
  assert.equal(data.title, 'Aerospace Student Workshop');
  assert.equal(data.summary, 'A workshop for AE students.');
  assert.equal(data.kind, 'workshop');
  assert.equal(data.area, 'campus');
  assert.equal(data.access, 'faculty');
  assert.deepEqual(data.skills, ['3d-printing', 'laser-cutting']);
  assert.deepEqual(data.contacts, ['don']);
  assert.equal(data.location.address, 'Kluyverweg 1, Delft');
  assert.equal(String(data.lastReviewed).slice(0, 10), today);
  assert.match(entry.body, /Bring your \*\*own\*\* material\./);
  assert.match(entry.body, /\*\*Contact:\*\* Someone New/);
  assert.ok(entry.notes.some((n) => n.includes('Glass blowing')), 'unknown skills are reported');
  assert.ok(entry.notes.some((n) => n.includes('Someone New')), 'unknown contacts are reported');
});

test('a machine needs a makerspace that exists', () => {
  const ok = build('equipment', { name: 'Big Laser', space: 'pmb', quantity: '2', training: 'Training required', booking: 'https://example.org/book', manual: 'not a link' });
  assert.equal(ok.ok, true);
  const data = front(ok);
  assert.equal(data.space, 'ide-pmb');
  assert.equal(data.quantity, 2);
  assert.equal(data.training, 'required');
  assert.equal(data.bookingUrl, 'https://example.org/book');
  assert.equal(data.links, undefined);
  assert.ok(ok.notes.some((n) => n.includes('not a complete web address')));

  const bad = build('equipment', { name: 'Big Laser', space: 'Narnia' });
  assert.equal(bad.ok, false);
  assert.match(bad.error, /Narnia/);
});

test('an existing page is never overwritten', () => {
  const entry = build('space', { name: 'ide pmb', summary: 'x', kind: 'Workshop', area: 'TU Delft campus' });
  assert.equal(entry.ok, false);
  assert.match(entry.error, /already a page/);
});

test('a person is only added with permission', () => {
  const without = build('person', { name: 'Ada', role: 'Student' });
  assert.equal(without.ok, false);
  const withBox = build('person', { name: 'Ada', role: 'Student', skills: '3D printing', consent: '- [X] I am this person…' });
  assert.equal(withBox.ok, true);
  assert.deepEqual(front(withBox).skills, ['3d-printing']);
  assert.equal(front(withBox).role, 'student');
});

test('a project links machines, places and skills', () => {
  const entry = build('project', { name: 'Lamp', summary: 'A lamp.', equipment: 'Prusa XL, Unknown machine', spaces: 'IDE StudioMake', year: '2025', link: 'https://example.org' });
  const data = front(entry);
  assert.deepEqual(data.equipment, ['prusa-xl']);
  assert.deepEqual(data.spaces, ['ide-studiomake']);
  assert.equal(data.year, 2025);
  assert.equal(data.links[0].url, 'https://example.org');
});

test('hostile input is defused', () => {
  const entry = build('skill', {
    name: 'Evil"\n---\ndraft: false',
    summary: '"quotes" and: colons\n---\ninjected: true',
    details: 'Hello <script>alert(1)</script> [x](javascript:alert(1))\n\n```\n#include <stdio.h>\n```\n\n<img width="10" src="https://github.com/user-attachments/assets/abc-123">',
  });
  assert.equal(entry.ok, true);
  const text = renderEntry(entry);
  const data = parse(text.split('\n---\n')[0].replace(/^---\n/, ''));
  assert.deepEqual(Object.keys(data).sort(), ['lastReviewed', 'summary', 'title'], 'no extra front matter can be smuggled in');
  assert.ok(!entry.body.includes('<script'), 'HTML is escaped');
  assert.ok(!/javascript:/i.test(entry.body), 'script links are broken');
  assert.ok(entry.body.includes('#include <stdio.h>'), 'code blocks are kept as they are');
  assert.ok(entry.body.includes('![](https://github.com/user-attachments/assets/abc-123)'), 'uploaded images survive');
  assert.match(entry.id, /^[a-z0-9-]+$/);
});

test('a long summary is cut and flagged', () => {
  const entry = build('skill', { name: 'Long', summary: 'x'.repeat(400) });
  assert.ok(front(entry).summary.length <= 240);
  assert.ok(entry.notes.some((n) => n.includes('240')));
});

test('an attached photo is picked up and added to the page', () => {
  const entry = build('space', { name: 'Photo Place', summary: 's', kind: 'Lab', area: 'Rotterdam', photo: '![IMG](https://github.com/user-attachments/assets/1234-abcd)' });
  assert.equal(entry.photoUrl, 'https://github.com/user-attachments/assets/1234-abcd');
  const data = front(entry, 'photo.jpg');
  assert.equal(data.image, './photo.jpg');
  assert.ok(data.imageAlt);
  assert.equal(cleanMarkdown('a < b'), 'a &lt; b');
});
