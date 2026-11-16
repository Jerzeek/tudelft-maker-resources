// ─────────────────────────────────────────────────────────────────────────────
// The shape of every page on the site.
//
// Each page is a folder in src/content/<collection>/<page-id>/ that holds an
// index.md file (and, optionally, photos). The lines between the two `---`
// markers at the top of index.md are checked against the rules below, so a
// typo or a missing field is caught before anything is published.
//
// See CONTRIBUTING.md for a friendly, example-driven version of this file.
// ─────────────────────────────────────────────────────────────────────────────
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { ACCESS, AREAS, ICONS, ROLES, SPACE_KINDS, TRAINING } from './forms/vocab.mjs';

const keys = <T extends Record<string, string>>(o: T) =>
  Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];

/** One page = one folder. The folder name is the page id (and its web address). */
const pages = (collection: string) =>
  glob({
    pattern: '*/index.md',
    base: `./src/content/${collection}`,
    generateId: ({ entry }) => entry.replace(/\/index\.md$/, ''),
  });

const link = z.object({
  label: z.string(),
  url: z.url(),
});

/** Fields every kind of page can have. */
const common = (image: any) => ({
  /** One or two sentences shown on cards and in search results. */
  summary: z.string().max(240).optional(),
  /** A photo that sits next to index.md, written as  ./photo.jpg */
  image: image().optional(),
  /** Describe the photo for people who cannot see it. */
  imageAlt: z.string().optional(),
  /** Who made the photo. */
  imageCredit: z.string().optional(),
  /** Extra links: manuals, booking pages, official websites… */
  links: z.array(link).default([]),
  /** When somebody last checked that this page is still correct (YYYY-MM-DD). */
  lastReviewed: z.coerce.date().optional(),
  /** Set to true to keep a page out of the published site. */
  draft: z.boolean().default(false),
});

const spaces = defineCollection({
  loader: pages('spaces'),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      ...common(image),
      kind: z.enum(keys(SPACE_KINDS)).default('workshop'),
      /** Faculty or organisation that runs the place. */
      organisation: z.string().optional(),
      area: z.enum(keys(AREAS)).default('campus'),
      access: z.enum(keys(ACCESS)).optional(),
      /** The small print of who may use it and how. */
      accessNotes: z.string().optional(),
      hours: z.string().optional(),
      website: z.url().optional(),
      location: z
        .object({
          building: z.string().optional(),
          room: z.string().optional(),
          address: z.string().optional(),
          /** Latitude and longitude put the place on the map. */
          lat: z.number().min(-90).max(90).optional(),
          lng: z.number().min(-180).max(180).optional(),
        })
        .default({}),
      /** People to ask (ids of pages in src/content/people). */
      contacts: z.array(reference('people')).default([]),
      /** What you can do here (ids of pages in src/content/skills). */
      skills: z.array(reference('skills')).default([]),
    }),
});

const equipment = defineCollection({
  loader: pages('equipment'),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      ...common(image),
      /** Where the machine stands (id of a page in src/content/spaces). */
      space: reference('spaces'),
      /** Skills you need or practise with it. */
      skills: z.array(reference('skills')).default([]),
      /** Brand and type, e.g. "Prusa XL (5 toolheads)". */
      model: z.string().optional(),
      quantity: z.number().int().positive().optional(),
      training: z.enum(keys(TRAINING)).optional(),
      trainingNotes: z.string().optional(),
      /** How to reserve it, in a sentence. */
      booking: z.string().optional(),
      bookingUrl: z.url().optional(),
      /** People to ask. Leave empty to show the contacts of the makerspace. */
      contacts: z.array(reference('people')).default([]),
    }),
});

const skills = defineCollection({
  loader: pages('skills'),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      ...common(image),
      icon: z.enum(ICONS as [string, ...string[]]).default('spark'),
      /** Other names people use, so search and submissions still find it. */
      aliases: z.array(z.string()).default([]),
    }),
});

const people = defineCollection({
  loader: pages('people'),
  schema: ({ image }) =>
    z.object({
      /** The name as the person wants it shown. */
      title: z.string(),
      ...common(image),
      role: z.enum(keys(ROLES)).default('other'),
      skills: z.array(reference('skills')).default([]),
      /** Only add contact details the person agreed to publish. */
      email: z.email().optional(),
      profileUrl: z.url().optional(),
    }),
});

const projects = defineCollection({
  loader: pages('projects'),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      ...common(image),
      /** Makers who have a page in src/content/people. */
      makers: z.array(reference('people')).default([]),
      /** Free-text credit for makers without a page, e.g. "Team Reboot, 2024". */
      credit: z.string().optional(),
      equipment: z.array(reference('equipment')).default([]),
      skills: z.array(reference('skills')).default([]),
      spaces: z.array(reference('spaces')).default([]),
      year: z.number().int().min(1990).max(2100).optional(),
    }),
});

export const collections = { spaces, equipment, skills, people, projects };
