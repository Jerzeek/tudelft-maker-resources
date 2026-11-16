// ─────────────────────────────────────────────────────────────────────────────
// Turns a submission (a GitHub issue created with one of the issue forms) into
// a content page. Pure functions only: nothing here touches the network or the
// disk, which keeps it easy to test (see scripts/submission.test.mjs).
//
// Everything in a submission is written by a stranger, so it is treated as
// plain data: it is never run, and HTML in it is defused.
// ─────────────────────────────────────────────────────────────────────────────
import { FORMS } from '../../src/forms/definitions.mjs';
import { COLLECTIONS, slugify } from '../../src/forms/vocab.mjs';

const EMPTY = /^(_no response_|none|n\/a|-)?$/i;

/** Which form was used? Decided by the labels on the issue. */
export function formForLabels(labels) {
  return FORMS.find((f) => f.collection && labels.includes(f.id)) ?? null;
}

/**
 * GitHub writes an issue-form submission as:
 *   ### Label of the field
 *
 *   the answer
 * This reads it back into { fieldId: answer }.
 */
export function parseIssueBody(body, form) {
  const byLabel = new Map(form.fields.map((f) => [f.label.trim().toLowerCase(), f]));
  const answers = {};
  const parts = String(body ?? '').replace(/\r\n/g, '\n').split(/^### +/m).slice(1);
  for (const part of parts) {
    const newline = part.indexOf('\n');
    const label = (newline === -1 ? part : part.slice(0, newline)).trim().toLowerCase();
    const field = byLabel.get(label);
    if (!field) continue;
    const value = newline === -1 ? '' : part.slice(newline + 1).trim();
    answers[field.id] = EMPTY.test(value) ? '' : value;
  }
  return answers;
}

const norm = (s) => slugify(s).replace(/-/g, '');
const oneLine = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const list = (s) => String(s ?? '').split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
const isUrl = (s) => {
  try {
    return ['http:', 'https:'].includes(new URL(s).protocol);
  } catch {
    return false;
  }
};

/** Find the page a name refers to: by id, title or alias (ignoring case and punctuation). */
export function findEntry(name, entries) {
  const wanted = norm(name);
  if (!wanted) return null;
  const exact = entries.find((e) => [e.id, e.title, ...(e.aliases ?? [])].some((n) => norm(n) === wanted));
  if (exact) return exact;
  // "PMB" should still find "IDE PMB" — but only if exactly one page matches.
  const partial = entries.filter((e) => norm(e.title).includes(wanted) || wanted.includes(norm(e.title)));
  return partial.length === 1 ? partial[0] : null;
}

/** Translate a dropdown answer ("Workshop") back to its key ("workshop"). */
const keyOf = (options, label) =>
  Object.entries(options).find(([k, v]) => norm(v) === norm(label) || norm(k) === norm(label))?.[0];

const ATTACHMENT = /https:\/\/(?:github\.com\/user-attachments\/assets\/[\w-]+|user-images\.githubusercontent\.com\/[\w/.-]+)/;
/** The first image that was dragged into a GitHub text box, if any. */
export const firstAttachment = (text) => String(text ?? '').match(ATTACHMENT)?.[0] ?? null;

/** Defuse free text: no HTML, no script links. Images dragged into GitHub stay as plain Markdown images. */
export function cleanMarkdown(text) {
  // Text inside ``` code fences ``` is shown literally by the site, so it is left alone.
  return String(text ?? '')
    .replace(/\r\n/g, '\n')
    .split(/(^```[\s\S]*?^```[^\n]*$)/m)
    .map((part, i) =>
      i % 2
        ? part
        : part
            .replace(/<img[^>]*?src="(https:\/\/github\.com\/user-attachments\/assets\/[\w-]+)"[^>]*>/gi, '![]($1)')
            .replace(/</g, '&lt;')
            .replace(/\b(javascript|vbscript|data)\s*:/gi, '$1&#58;'),
    )
    .join('')
    .trim();
}

/** Write a value as YAML. JSON strings are valid YAML, which makes this safe for any input. */
const yaml = (v) => (Array.isArray(v) ? `[${v.map((x) => JSON.stringify(x)).join(', ')}]` : typeof v === 'string' ? JSON.stringify(v) : String(v));

export function frontMatter(data) {
  const lines = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) continue;
    if (Array.isArray(value) && typeof value[0] === 'object') {
      lines.push(`${key}:`);
      for (const item of value) {
        const pairs = Object.entries(item);
        pairs.forEach(([k, v], i) => lines.push(`  ${i === 0 ? '- ' : '  '}${k}: ${yaml(v)}`));
      }
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      const pairs = Object.entries(value).filter(([, v]) => v !== undefined && v !== '');
      if (!pairs.length) continue;
      lines.push(`${key}:`);
      for (const [k, v] of pairs) lines.push(`  ${k}: ${yaml(v)}`);
    } else if (key === 'lastReviewed' || key === 'image') {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: ${yaml(value)}`);
    }
  }
  return `---\n${lines.join('\n')}\n---\n`;
}

/**
 * Build the page for a submission.
 *
 * @param form     the form definition that was used
 * @param answers  { fieldId: answer } from parseIssueBody
 * @param existing { spaces: [{id, title, aliases}], equipment: […], skills: […], people: […], projects: […] }
 * @param today    "YYYY-MM-DD"
 * @returns { ok, id, path, content, photoUrl, notes[], error }
 *          `notes` are things a maintainer should look at; `error` explains why no page could be made.
 */
export function buildEntry({ form, answers, existing, today }) {
  const a = answers;
  const notes = [];
  const fail = (error) => ({ ok: false, error, notes });

  const title = oneLine(a.name);
  if (!title) return fail('The submission has no name, so no page could be made.');
  const id = slugify(title);
  if (!id) return fail(`The name "${title}" cannot be turned into a web address. Please use letters or digits.`);

  const same = existing[form.collection].find((e) => e.id === id || norm(e.title) === norm(title));
  if (same) {
    return fail(
      `There is already a page called "${same.title}" (\`src/content/${form.collection}/${same.id}/index.md\`). ` +
        'To change it, use the "Edit this page" button on that page, or report a correction.',
    );
  }

  /** Match a comma-separated answer against existing pages. Unknown names become notes. */
  const refs = (answer, collection) => {
    const ids = [];
    const unknown = [];
    for (const name of list(answer)) {
      const hit = findEntry(name, existing[collection]);
      if (hit) ids.includes(hit.id) || ids.push(hit.id);
      else unknown.push(name);
    }
    return { ids, unknown };
  };
  const choice = (answer, fieldId) => {
    if (!answer) return undefined;
    const options = form.fields.find((f) => f.id === fieldId).options;
    const key = keyOf(options, answer);
    if (!key) notes.push(`"${answer}" is not one of the choices for "${fieldId}", so it was left out.`);
    return key;
  };
  const link = (answer, what) => {
    if (!answer) return undefined;
    if (isUrl(answer)) return answer;
    notes.push(`The ${what} "${answer}" is not a complete web address (it should start with https://), so it was left out.`);
    return undefined;
  };
  const summary = (text) => {
    const s = oneLine(text);
    if (s.length <= 240) return s || undefined;
    notes.push('The short description was longer than 240 characters and has been cut off. Please shorten it properly.');
    return `${s.slice(0, 237).trimEnd()}…`;
  };
  const skills = () => {
    const { ids, unknown } = refs(a.skills, 'skills');
    if (unknown.length)
      notes.push(`Unknown skill${unknown.length > 1 ? 's' : ''}: ${unknown.map((u) => `"${u}"`).join(', ')}. Pick an existing skill, or add a skill page first.`);
    return ids;
  };

  let data;
  const extra = []; // lines added under the text of the page

  switch (form.id) {
    case 'space': {
      const contacts = refs(a.contacts, 'people');
      if (contacts.unknown.length) {
        extra.push(`**Contact:** ${contacts.unknown.join(', ')}`);
        notes.push(`${contacts.unknown.map((u) => `"${u}"`).join(', ')} ${contacts.unknown.length > 1 ? 'have' : 'has'} no page under People yet, so the name is mentioned in the text instead. Check that they agreed to be listed.`);
      }
      if (a.location) notes.push('The whole location is stored as the address. Split it into building / room / address, and add `lat` and `lng` to put the place on the map.');
      data = {
        title,
        summary: summary(a.summary),
        kind: choice(a.kind, 'kind'),
        organisation: oneLine(a.organisation),
        area: choice(a.area, 'area'),
        access: choice(a.access, 'access'),
        accessNotes: oneLine(a['access-notes']),
        hours: oneLine(a.hours),
        website: link(a.website, 'website'),
        location: { address: oneLine(a.location) },
        contacts: contacts.ids,
        skills: skills(),
      };
      break;
    }
    case 'equipment': {
      const space = findEntry(a.space, existing.spaces);
      if (!space) {
        return fail(
          `The makerspace "${oneLine(a.space)}" was not recognised. Known makerspaces: ${existing.spaces.map((s) => s.title).join(', ')}. ` +
            'If the place is new, add the makerspace first.',
        );
      }
      const quantity = parseInt(a.quantity, 10);
      const manual = link(a.manual, 'manual link');
      const booking = oneLine(a.booking);
      data = {
        title,
        summary: summary(a.summary),
        space: space.id,
        skills: skills(),
        model: oneLine(a.model),
        quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : undefined,
        training: choice(a.training, 'training'),
        trainingNotes: oneLine(a['training-notes']),
        booking: isUrl(booking) ? undefined : booking,
        bookingUrl: isUrl(booking) ? booking : undefined,
        links: manual ? [{ label: 'Manual', url: manual }] : [],
      };
      break;
    }
    case 'project': {
      const machines = refs(a.equipment, 'equipment');
      const places = refs(a.spaces, 'spaces');
      for (const [what, r] of [['machine', machines], ['makerspace', places]])
        if (r.unknown.length) notes.push(`Unknown ${what}${r.unknown.length > 1 ? 's' : ''}: ${r.unknown.map((u) => `"${u}"`).join(', ')}. Left out; link them by hand if they exist under another name.`);
      const year = parseInt(a.year, 10);
      const more = link(a.link, 'link');
      data = {
        title,
        summary: summary(a.summary),
        credit: oneLine(a.credit),
        year: year >= 1990 && year <= 2100 ? year : undefined,
        equipment: machines.ids,
        spaces: places.ids,
        skills: skills(),
        links: more ? [{ label: 'More about this project', url: more }] : [],
      };
      break;
    }
    case 'person': {
      if (!/\[x\]/i.test(a.consent ?? '')) {
        return fail('The permission box was not ticked. People are only listed if they agree to it.');
      }
      notes.push('This adds a person to a public website. Make sure the submission really comes from them (or with their permission) before you merge.');
      data = {
        title,
        summary: summary(a.summary),
        role: choice(a.role, 'role'),
        skills: skills(),
        profileUrl: link(a.profile, 'profile link'),
      };
      break;
    }
    case 'skill': {
      data = { title, summary: summary(a.summary) };
      notes.push('Choose a fitting `icon` for the skill (the list is in `src/forms/vocab.mjs`), and add `aliases` people might search for.');
      break;
    }
    default:
      return fail(`Submissions of type "${form.id}" are handled by hand.`);
  }

  const photoUrl = firstAttachment(a.photo);
  if (a.photo && !photoUrl) notes.push('The photo box contained text but no uploaded image.');

  const body = [cleanMarkdown(a.details), ...extra].filter(Boolean).join('\n\n');
  if (!body) notes.push('The page has no text yet. A few sentences would make it much more useful.');

  return {
    ok: true,
    id,
    collection: form.collection,
    path: `src/content/${form.collection}/${id}/index.md`,
    data: { ...data, lastReviewed: today },
    body,
    photoUrl,
    notes,
    title,
    kind: COLLECTIONS[form.collection].singular.toLowerCase(),
  };
}

/** The finished index.md. `image` is added once the photo has been downloaded. */
export function renderEntry(entry, image) {
  const data = { ...entry.data };
  if (image) {
    // keep `lastReviewed` as the last line
    const { lastReviewed, ...rest } = data;
    Object.assign(rest, { image: `./${image}`, imageAlt: `Photo of ${entry.title}`, lastReviewed });
    return frontMatter(rest) + (entry.body ? `\n${entry.body}\n` : '');
  }
  return frontMatter(data) + (entry.body ? `\n${entry.body}\n` : '');
}
