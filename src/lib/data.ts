// ─────────────────────────────────────────────────────────────────────────────
// Loads all pages once, checks that they point to each other correctly, and
// offers small helpers to answer questions like "which machines stand in this
// makerspace?" or "who knows about laser cutting?".
// ─────────────────────────────────────────────────────────────────────────────
import { getCollection, type CollectionEntry } from 'astro:content';
import site from '../../site.config.mjs';
import { COLLECTIONS, ID_PATTERN } from '../forms/vocab.mjs';

export type CollectionName = 'spaces' | 'equipment' | 'skills' | 'people' | 'projects';
export type Space = CollectionEntry<'spaces'>;
export type Equipment = CollectionEntry<'equipment'>;
export type Skill = CollectionEntry<'skills'>;
export type Person = CollectionEntry<'people'>;
export type Project = CollectionEntry<'projects'>;
export type AnyEntry = Space | Equipment | Skill | Person | Project;

type Ref = { collection: string; id: string };

const byTitle = (a: AnyEntry, b: AnyEntry) =>
  a.data.title.localeCompare(b.data.title, 'en', { sensitivity: 'base', numeric: true });

async function load() {
  const published = (e: AnyEntry) => !e.data.draft;
  const [spaces, equipment, skills, people, projects] = await Promise.all([
    getCollection('spaces', published),
    getCollection('equipment', published),
    getCollection('skills', published),
    getCollection('people', published),
    getCollection('projects', published),
  ]);
  for (const list of [spaces, equipment, skills, people, projects]) list.sort(byTitle);

  const all = { spaces, equipment, skills, people, projects };
  const index = {
    spaces: new Map(spaces.map((e) => [e.id, e])),
    equipment: new Map(equipment.map((e) => [e.id, e])),
    skills: new Map(skills.map((e) => [e.id, e])),
    people: new Map(people.map((e) => [e.id, e])),
    projects: new Map(projects.map((e) => [e.id, e])),
  };

  // ── Integrity check ───────────────────────────────────────────────────────
  // Every page id must be web-safe, and every link between pages must point
  // to a page that exists. Problems stop the build with a readable message.
  const problems: string[] = [];
  const file = (e: AnyEntry) => `src/content/${e.collection}/${e.id}/index.md`;
  const check = (from: AnyEntry, field: string, refs: Ref | Ref[] | undefined) => {
    for (const ref of [refs ?? []].flat()) {
      const target = index[ref.collection as CollectionName];
      if (!target?.has(ref.id)) {
        const known = [...(target?.keys() ?? [])].join(', ') || '(none yet)';
        problems.push(
          `${file(from)}\n    "${field}" mentions "${ref.id}", but there is no page ` +
            `src/content/${ref.collection}/${ref.id}/index.md.\n    Existing ${ref.collection}: ${known}`,
        );
      }
    }
  };
  for (const e of [...spaces, ...equipment, ...skills, ...people, ...projects]) {
    if (!ID_PATTERN.test(e.id)) {
      problems.push(
        `${file(e)}\n    The folder name "${e.id}" may only contain lowercase letters, digits and dashes (for example "laser-cutter").`,
      );
    }
    if (e.data.image && !e.data.imageAlt) {
      problems.push(`${file(e)}\n    The page has an "image" but no "imageAlt" — add a short description of the photo.`);
    }
  }
  for (const e of spaces) {
    check(e, 'contacts', e.data.contacts);
    check(e, 'skills', e.data.skills);
    const { lat, lng } = e.data.location;
    if ((lat === undefined) !== (lng === undefined)) {
      problems.push(`${file(e)}\n    "location" needs both "lat" and "lng" (or neither).`);
    }
  }
  for (const e of equipment) {
    check(e, 'space', e.data.space);
    check(e, 'skills', e.data.skills);
    check(e, 'contacts', e.data.contacts);
  }
  for (const e of people) check(e, 'skills', e.data.skills);
  for (const e of projects) {
    check(e, 'makers', e.data.makers);
    check(e, 'equipment', e.data.equipment);
    check(e, 'skills', e.data.skills);
    check(e, 'spaces', e.data.spaces);
  }
  if (problems.length) {
    throw new Error(
      `\n\n✖ ${problems.length} problem${problems.length > 1 ? 's' : ''} found in the content:\n\n  • ` +
        problems.join('\n\n  • ') +
        '\n\nFix the file(s) above and try again. CONTRIBUTING.md explains every field.\n',
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const ids = (refs: Ref[]) => refs.map((r) => r.id);
  const pick = <T,>(map: Map<string, T>, refs: Ref[]) => refs.map((r) => map.get(r.id)!).filter(Boolean);
  const uniq = <T extends AnyEntry>(list: T[]) => [...new Map(list.map((e) => [e.id, e])).values()].sort(byTitle);

  const equipmentIn = (spaceId: string) => equipment.filter((e) => e.data.space.id === spaceId);

  /** Skills of a makerspace: the ones listed on its page plus those of its machines. */
  const skillsOfSpace = (space: Space) =>
    uniq([
      ...pick(index.skills, space.data.skills),
      ...equipmentIn(space.id).flatMap((e) => pick(index.skills, e.data.skills)),
    ]);

  const spacesForSkill = (skillId: string) => spaces.filter((s) => skillsOfSpace(s).some((k) => k.id === skillId));
  const equipmentForSkill = (skillId: string) => equipment.filter((e) => ids(e.data.skills).includes(skillId));
  const peopleWithSkill = (skillId: string) => people.filter((p) => ids(p.data.skills).includes(skillId));
  const projectsWithSkill = (skillId: string) => projects.filter((p) => ids(p.data.skills).includes(skillId));

  /** Contacts of a machine; falls back to the contacts of its makerspace. */
  const contactsOfEquipment = (e: Equipment) =>
    e.data.contacts.length
      ? pick(index.people, e.data.contacts)
      : pick(index.people, index.spaces.get(e.data.space.id)!.data.contacts);

  const spacesOfPerson = (personId: string) => spaces.filter((s) => ids(s.data.contacts).includes(personId));
  const equipmentOfPerson = (personId: string) => equipment.filter((e) => ids(e.data.contacts).includes(personId));
  const projectsOfPerson = (personId: string) => projects.filter((p) => ids(p.data.makers).includes(personId));

  const projectsUsingEquipment = (equipmentId: string) =>
    projects.filter((p) => ids(p.data.equipment).includes(equipmentId));

  /** Projects made in a makerspace: listed explicitly, or made on one of its machines. */
  const projectsInSpace = (spaceId: string) => {
    const machineIds = new Set(equipmentIn(spaceId).map((e) => e.id));
    return projects.filter(
      (p) => ids(p.data.spaces).includes(spaceId) || ids(p.data.equipment).some((id) => machineIds.has(id)),
    );
  };

  return {
    ...all,
    index,
    pick,
    equipmentIn,
    skillsOfSpace,
    spacesForSkill,
    equipmentForSkill,
    peopleWithSkill,
    projectsWithSkill,
    contactsOfEquipment,
    spacesOfPerson,
    equipmentOfPerson,
    projectsOfPerson,
    projectsUsingEquipment,
    projectsInSpace,
  };
}

let cache: ReturnType<typeof load> | undefined;
/** All published pages plus helpers. Loaded once per build. */
export const getData = () => (cache ??= load());

// ── Small, page-level helpers ────────────────────────────────────────────────

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Prefix a site path with the address the site is published under. */
export const url = (path = '/') => `${base}${path.startsWith('/') ? path : `/${path}`}`;

/** Web address of a page. */
export const pageUrl = (collection: string, id: string) =>
  url(`/${COLLECTIONS[collection as CollectionName].path}/${id}/`);
export const entryUrl = (e: AnyEntry) => pageUrl(e.collection, e.id);

/** Where the page lives in the repository. */
export const sourcePath = (e: AnyEntry) => `src/content/${e.collection}/${e.id}/index.md`;
export const editUrl = (e: AnyEntry) => `https://github.com/${site.repo}/edit/${site.branch}/${sourcePath(e)}`;

/** A page with (almost) no text yet: we invite visitors to help fill it in. */
export const needsHelp = (e: AnyEntry) => (e.body ?? '').trim().length < 120;

/** Was the page last checked longer ago than `staleAfterMonths`? */
export const isStale = (e: AnyEntry, now = new Date()) => {
  if (!e.data.lastReviewed) return false;
  const limit = new Date(now);
  limit.setMonth(limit.getMonth() - site.staleAfterMonths);
  return e.data.lastReviewed < limit;
};

export const formatMonth = (d: Date) =>
  d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** Initials for the round avatar of a person without a photo. */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[\p{Lu}\p{Lt}]/u.test(w))
    .map((w) => w[0])
    .slice(0, 2)
    .join('') || name.slice(0, 1).toUpperCase();
