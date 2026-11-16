// Start a new page with all the fields laid out, ready to fill in.
//
//   npm run new -- space "Aerospace workshop"
//   npm run new -- equipment "Laser cutter" --space ide-pmb
//   (kinds: space, equipment, skill, person, project)
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugify } from '../src/forms/vocab.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [kind, name] = process.argv.slice(2);
const spaceFlag = process.argv.indexOf('--space');
const space = spaceFlag === -1 ? 'FILL-IN-the-id-of-the-makerspace' : process.argv[spaceFlag + 1];
const today = new Date().toISOString().slice(0, 10);
const title = JSON.stringify(name ?? '');

const templates = {
  space: ['spaces', `title: ${title}
summary: ""            # one or two sentences, shown on the cards
kind: workshop         # workshop | makerspace | lab | studio | materials | courses
organisation: ""       # faculty or organisation that runs it
area: campus           # campus | delft | rotterdam | elsewhere
# access: tudelft      # open | tudelft | faculty | arrangement | membership
# accessNotes: ""      # how do you get in?
# hours: ""            # e.g. "Mon–Fri 8:30–17:00"
# website: https://
location:
  building: ""
  room: ""
  address: ""
  # lat: 52.0000       # latitude and longitude put the place on the map
  # lng: 4.3700
contacts: []           # ids of pages under people, e.g. [don]
skills: []             # ids of pages under skills, e.g. [3d-printing, woodworking]
# image: ./photo.jpg   # put the photo next to this file
# imageAlt: ""         # what is on the photo?
# imageCredit: ""      # who made it?
lastReviewed: ${today}`],
  equipment: ['equipment', `title: ${title}
summary: ""            # what is it good for?
space: ${space}
skills: []             # e.g. [laser-cutting]
# model: ""            # brand and type
# quantity: 1
# training: required   # none | required | staff | arrangement
# trainingNotes: ""    # how do you get trained?
# booking: ""          # how do you reserve it?
# bookingUrl: https://
# image: ./photo.jpg
# imageAlt: ""
lastReviewed: ${today}`],
  skill: ['skills', `title: ${title}
summary: ""            # what is it, in one or two sentences?
icon: spark            # see the list of ICONS in src/forms/vocab.mjs
aliases: []            # other names people search for
lastReviewed: ${today}`],
  person: ['people', `title: ${title}
summary: ""            # one line about this person
role: other            # workshop-staff | teacher | researcher | student | other
skills: []             # e.g. [electronics]
# profileUrl: https://
# email: name@example.org   # only with the person's permission
lastReviewed: ${today}`],
  project: ['projects', `title: ${title}
summary: ""            # what is it, in one or two sentences?
makers: []             # ids of pages under people
# credit: ""           # names of makers without a page
# year: ${today.slice(0, 4)}
equipment: []          # ids of machines that were used
spaces: []             # ids of makerspaces where it was made
skills: []
# image: ./photo.jpg
# imageAlt: ""
lastReviewed: ${today}`],
};

if (!templates[kind] || !name) {
  console.error('Usage: npm run new -- <space|equipment|skill|person|project> "Name" [--space id-of-makerspace]');
  process.exit(1);
}
const [collection, front] = templates[kind];
const id = slugify(name);
const file = join(root, 'src/content', collection, id, 'index.md');
if (existsSync(file)) {
  console.error(`✖ ${file} already exists.`);
  process.exit(1);
}
mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, `---\n${front}\n---\n\nWrite the page here. You can use Markdown: **bold**, lists, [links](https://example.org) and ## headings.\n`);
console.log(`✔ Created src/content/${collection}/${id}/index.md — open it and fill it in.`);
