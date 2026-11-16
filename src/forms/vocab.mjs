// ─────────────────────────────────────────────────────────────────────────────
// Shared vocabulary: the fixed choices used in page headers ("front matter").
// The site, the submission forms and the checks all read from this one file.
// To add a choice, add a line here — nothing else needs to change.
//   key   = what you write in a content file, e.g.  kind: workshop
//   value = what visitors see on the site
// ─────────────────────────────────────────────────────────────────────────────

/** The five kinds of pages on the site. */
export const COLLECTIONS = {
  spaces: { singular: 'Makerspace', plural: 'Makerspaces', path: 'spaces' },
  equipment: { singular: 'Machine', plural: 'Equipment', path: 'equipment' },
  skills: { singular: 'Skill', plural: 'Skills', path: 'skills' },
  people: { singular: 'Person', plural: 'People', path: 'people' },
  projects: { singular: 'Project', plural: 'Projects', path: 'projects' },
};

/** What kind of place a makerspace is. */
export const SPACE_KINDS = {
  workshop: 'Workshop',
  makerspace: 'Makerspace',
  lab: 'Lab',
  studio: 'Open studio',
  materials: 'Materials & supplies',
  courses: 'Courses',
};

/** Roughly where a place is. */
export const AREAS = {
  campus: 'TU Delft campus',
  delft: 'Delft (off campus)',
  rotterdam: 'Rotterdam',
  elsewhere: 'Elsewhere',
};

/** Who can use a place. */
export const ACCESS = {
  open: 'Open to everyone',
  tudelft: 'All TU Delft students & staff',
  faculty: 'Own faculty only',
  arrangement: 'By arrangement',
  membership: 'Membership or course fee',
};

/** What you need before you may use a machine. */
export const TRAINING = {
  none: 'No training needed',
  required: 'Training required',
  staff: 'Operated by staff',
  arrangement: 'By arrangement',
};

/** How a person is involved. */
export const ROLES = {
  'workshop-staff': 'Workshop staff',
  teacher: 'Teacher',
  researcher: 'Researcher',
  student: 'Student',
  other: 'Maker',
};

/** Icons that a skill can use (see src/components/Icon.astro). */
export const ICONS = [
  'printer-3d',
  'laser',
  'cnc',
  'wood',
  'metal',
  'electronics',
  'scan',
  'xr',
  'textile',
  'plastic',
  'paint',
  'ceramics',
  'camera',
  'tools',
  'spark',
];

/** Page ids are lowercase words joined by dashes, e.g. "ide-pmb". */
export const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Turn any text into a valid page id: "IDE PMB (ground floor)" → "ide-pmb-ground-floor". */
export function slugify(text) {
  return String(text ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}
