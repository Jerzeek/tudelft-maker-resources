// ─────────────────────────────────────────────────────────────────────────────
// The submission forms, defined once.
//
// Three things are generated from this file, so they can never drift apart:
//   1. the form on the website's Contribute page,
//   2. the GitHub issue forms in .github/ISSUE_TEMPLATE (run `npm run forms`),
//   3. the robot that turns a submission into a ready-to-merge page
//      (scripts/issue-to-content.mjs).
//
// Field types
//   input      one line of text
//   textarea   several lines (Markdown allowed)
//   dropdown   choose one of `options` (an object from vocab.mjs)
//   pick-one   one existing page from the collection named in `source`
//   pick-many  several existing pages from the collection named in `source`
//   photo      drag-and-drop image (only on GitHub; e-mail users attach it)
//   consent    a box that must be ticked
//
// After changing this file, run:  npm run forms
// ─────────────────────────────────────────────────────────────────────────────
import { ACCESS, AREAS, ROLES, SPACE_KINDS, TRAINING } from './vocab.mjs';

const photo = {
  id: 'photo',
  type: 'photo',
  label: 'Photo',
  hint: 'Drag one photo that you made yourself (or may share) into this box. Avoid recognisable people unless they agree.',
};
const details = (hint) => ({ id: 'details', type: 'textarea', label: 'Anything else worth knowing', hint });
const submitter = {
  id: 'submitter',
  type: 'input',
  label: 'Your name or e-mail (optional)',
  hint: 'Only used if we have a question about your submission. It is visible to others on GitHub, so leave it empty if you prefer.',
};
const skills = (label, hint) => ({
  id: 'skills',
  type: 'pick-many',
  source: 'skills',
  label,
  hint: hint ?? 'Separate several with commas, for example: 3D printing, Electronics',
});

export const FORMS = [
  {
    id: 'space',
    collection: 'spaces',
    icon: 'spaces',
    name: 'A makerspace',
    title: 'Add a makerspace, workshop or lab',
    description: 'A workshop, lab, studio, shop or course location where people can make things.',
    issueTitle: 'Add makerspace: ',
    fields: [
      { id: 'name', type: 'input', label: 'Name of the place', required: true, placeholder: 'e.g. Aerospace student workshop' },
      {
        id: 'summary',
        type: 'input',
        label: 'What is it, in one or two sentences?',
        required: true,
        hint: 'Shown on the overview cards. Aim for under 200 characters.',
      },
      { id: 'kind', type: 'dropdown', label: 'What kind of place is it?', options: SPACE_KINDS, required: true },
      { id: 'area', type: 'dropdown', label: 'Where is it?', options: AREAS, required: true },
      {
        id: 'location',
        type: 'input',
        label: 'Building, room and address',
        placeholder: 'e.g. Faculty of IDE, room B-2-100, Landbergstraat 15, Delft',
      },
      { id: 'organisation', type: 'input', label: 'Who runs it?', placeholder: 'e.g. Faculty of Aerospace Engineering' },
      { id: 'access', type: 'dropdown', label: 'Who can use it?', options: ACCESS },
      {
        id: 'access-notes',
        type: 'textarea',
        label: 'How do you get in?',
        hint: 'Training, registration, costs, house rules — whatever a first-time visitor needs to know.',
      },
      { id: 'hours', type: 'input', label: 'Opening hours', placeholder: 'e.g. Mon–Fri 8:30–17:00' },
      { id: 'website', type: 'input', label: 'Website', placeholder: 'https://' },
      skills('What can you do there?'),
      {
        id: 'contacts',
        type: 'pick-many',
        source: 'people',
        label: 'Who can people ask?',
        hint: 'Names of staff or volunteers. Please only name people who are happy to be listed.',
      },
      details('Facilities, tips for newcomers, things people often get wrong…'),
      photo,
      submitter,
    ],
  },
  {
    id: 'equipment',
    collection: 'equipment',
    icon: 'equipment',
    name: 'A machine or tool',
    title: 'Add a machine or tool',
    description: 'A 3D printer, laser cutter, sewing machine, oscilloscope… anything people can use.',
    issueTitle: 'Add equipment: ',
    fields: [
      { id: 'name', type: 'input', label: 'Name of the machine or tool', required: true, placeholder: 'e.g. Laser cutter' },
      {
        id: 'space',
        type: 'pick-one',
        source: 'spaces',
        label: 'In which makerspace is it?',
        required: true,
        hint: 'Use the name as it appears on this site. Is the place missing? Add the makerspace first.',
      },
      { id: 'model', type: 'input', label: 'Brand and model', placeholder: 'e.g. Trotec Speedy 360' },
      { id: 'quantity', type: 'input', label: 'How many are there?', placeholder: 'e.g. 3' },
      { id: 'summary', type: 'input', label: 'What is it good for, in a sentence?' },
      skills('Which skills does it involve?'),
      { id: 'training', type: 'dropdown', label: 'What do you need before using it?', options: TRAINING },
      {
        id: 'training-notes',
        type: 'textarea',
        label: 'How do you get trained or get access?',
        hint: 'Where to sign up, how long it takes, who to ask.',
      },
      { id: 'booking', type: 'input', label: 'How do you reserve it?', placeholder: 'e.g. Walk in, or a link to the booking page' },
      { id: 'manual', type: 'input', label: 'Link to a manual or instructions', placeholder: 'https://' },
      details('Materials it can handle, maximum size, typical mistakes, tips…'),
      photo,
      submitter,
    ],
  },
  {
    id: 'project',
    collection: 'projects',
    icon: 'projects',
    name: 'A project',
    title: 'Share a project',
    description: 'Something that was made here. Show others what is possible and how you did it.',
    issueTitle: 'Add project: ',
    fields: [
      { id: 'name', type: 'input', label: 'Name of the project', required: true },
      { id: 'summary', type: 'input', label: 'What is it, in one or two sentences?', required: true },
      { id: 'credit', type: 'input', label: 'Who made it?', hint: 'Names as they should appear on the site.' },
      { id: 'year', type: 'input', label: 'Year', placeholder: 'e.g. 2025' },
      { id: 'equipment', type: 'pick-many', source: 'equipment', label: 'Which machines did you use?' },
      { id: 'spaces', type: 'pick-many', source: 'spaces', label: 'Where was it made?' },
      skills('Which skills did it take?'),
      { id: 'link', type: 'input', label: 'Link to more (repository, report, video)', placeholder: 'https://' },
      details('How you made it, step by step if you like. What would you do differently?'),
      photo,
      submitter,
    ],
  },
  {
    id: 'person',
    collection: 'people',
    icon: 'people',
    name: 'Yourself',
    title: 'Add yourself',
    description: 'Let others know what you can help with. Only add yourself, or someone who asked you to.',
    issueTitle: 'Add person: ',
    fields: [
      { id: 'name', type: 'input', label: 'Name, as it should be shown', required: true },
      { id: 'role', type: 'dropdown', label: 'How are you involved?', options: ROLES, required: true },
      skills('What can you help others with?'),
      {
        id: 'summary',
        type: 'input',
        label: 'One line about you',
        placeholder: 'e.g. Runs the textile corner; ask me about e-textiles',
      },
      { id: 'profile', type: 'input', label: 'Link to a profile page', placeholder: 'https://' },
      details('What you work on, when and where people can find you…'),
      {
        id: 'consent',
        type: 'consent',
        label: 'Permission',
        option: 'I am this person, or I have their permission, and I agree that this information is published on a public website.',
        required: true,
      },
    ],
  },
  {
    id: 'skill',
    collection: 'skills',
    icon: 'skills',
    name: 'A skill',
    title: 'Add a skill',
    description: 'A technique people can learn, such as welding or screen printing.',
    issueTitle: 'Add skill: ',
    fields: [
      { id: 'name', type: 'input', label: 'Name of the skill', required: true, placeholder: 'e.g. Screen printing' },
      { id: 'summary', type: 'input', label: 'What is it, in one or two sentences?', required: true },
      details('How to get started, where to learn it, good tutorials, communities to join…'),
      submitter,
    ],
  },
  {
    id: 'correction',
    collection: null, // handled by a person, not by the robot
    icon: 'flag',
    name: 'A correction',
    title: 'Report a mistake or outdated information',
    description: 'Something on the site is wrong, missing or out of date.',
    issueTitle: 'Correction: ',
    fields: [
      { id: 'name', type: 'input', label: 'Which page is it about?', required: true, placeholder: 'e.g. IDE PMB' },
      { id: 'problem', type: 'textarea', label: 'What is wrong or missing?', required: true },
      { id: 'fix', type: 'textarea', label: 'What should it say instead?', hint: 'If you know. A link to a source helps a lot.' },
      submitter,
    ],
  },
];

export const formById = (id) => FORMS.find((f) => f.id === id);
/** File name of the GitHub issue form that belongs to a form. */
export const templateFile = (form) => (form.collection ? `add-${form.id}.yml` : `${form.id}.yml`);
/** Labels put on the GitHub issue. `submission` wakes up the robot. */
export const labelsOf = (form) => (form.collection ? ['submission', form.id] : [form.id]);
