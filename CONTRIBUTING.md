# Contributing

Thank you for helping. This guide is written by the people who use the workshops, and every small fix counts.

There are three ways to contribute, from easiest to most hands-on.

## 1. Use the form (no technical knowledge needed)

Go to the **Contribute** page of the site, choose what you want to add, and fill in what you know. A draft page is made automatically and a maintainer checks it before it goes live.

## 2. Edit a page on GitHub

Every page on the site ends with an **Edit this page** button. It opens the page's text file on GitHub.

1. Sign in to GitHub (a free account is enough).
2. Change the text. The *Preview* tab shows the result.
3. Press **Commit changes…**, describe in a few words what you changed, and press **Propose changes**, then **Create pull request**.

That's it. Automatic checks run on your proposal, and a maintainer merges it. You cannot break the site: nothing is published before the checks pass and a maintainer agrees.

## 3. Add a page by hand

### One page = one folder

```
src/content/
  spaces/                 makerspaces, workshops, labs, shops
    ide-pmb/
      index.md            ← the page
      workshop.jpg        ← photos sit next to it
  equipment/              machines and tools
  skills/                 techniques
  people/                 who to ask
  projects/               things that were made
```

The **folder name is the page's id** and its web address: `spaces/ide-pmb/` becomes `…/spaces/ide-pmb/`. Use lowercase letters, digits and dashes only.

To add a page on GitHub: open the right folder, choose **Add file → Create new file**, and type `my-new-place/index.md` as the name (the slash creates the folder).

### What a page looks like

A page has two parts: a header with facts between two `---` lines, and free text below it.

```markdown
---
title: "Aerospace Student Workshop"
summary: "Walk-in workshop for composites and light metalwork."
kind: workshop
area: campus
access: faculty
hours: "Mon–Fri 9:00–17:00"
location:
  building: "Faculty of Aerospace Engineering"
  room: "Hall 2"
  address: "Kluyverweg 1, 2629 HS Delft"
  lat: 51.9902
  lng: 4.3755
contacts: [don]
skills: [metalworking, 3d-printing]
image: ./workshop.jpg
imageAlt: "Students laminating a wing section at a long workbench."
imageCredit: "Jane Doe"
lastReviewed: 2026-11-16
---

Write whatever a first-time visitor needs to know.

## House rules

- Lists, **bold**, [links](https://example.org) and headings all work.
```

Only `title` is always required (plus `space` for equipment). Leave out what you do not know.

### Fields that every page can have

| Field | What it is |
|---|---|
| `title` | The name. |
| `summary` | One or two sentences (max. 240 characters) for cards and search results. |
| `image` | A photo next to `index.md`, written as `./photo.jpg`. Any size; the site makes small versions itself. |
| `imageAlt` | What is on the photo, for people who cannot see it. Required when there is an `image`. |
| `imageCredit` | Who made the photo. |
| `links` | Extra links, each with a `label` and a `url` (see below). |
| `lastReviewed` | The date (`YYYY-MM-DD`) on which someone last checked that the page is correct. |
| `draft` | `true` keeps the page off the site. |

```yaml
links:
  - label: "Booking page"
    url: "https://example.org/book"
```

### Makerspaces (`src/content/spaces`)

| Field | What it is | Choices |
|---|---|---|
| `kind` | What kind of place | `workshop`, `makerspace`, `lab`, `studio`, `materials`, `courses` |
| `organisation` | Faculty or organisation that runs it | |
| `area` | Roughly where | `campus`, `delft`, `rotterdam`, `elsewhere` |
| `access` | Who can use it | `open`, `tudelft`, `faculty`, `arrangement`, `membership` |
| `accessNotes` | How you get in: training, registration, costs | |
| `hours` | Opening hours | |
| `website` | The official website | |
| `location` | `building`, `room`, `address`, and `lat` + `lng` for the map | |
| `contacts` | People to ask: ids of pages under `people` | |
| `skills` | What you can do there: ids of pages under `skills` | |

**Putting a place on the map:** find it on [openstreetmap.org](https://www.openstreetmap.org), right-click the spot and choose *Show address*. The two numbers are `lat` and `lng`.

### Equipment (`src/content/equipment`)

| Field | What it is | Choices |
|---|---|---|
| `space` | **Required.** The id of the makerspace where it stands, e.g. `ide-pmb` | |
| `skills` | Skills involved: ids of pages under `skills` | |
| `model` | Brand and type | |
| `quantity` | How many there are | |
| `training` | What you need before using it | `none`, `required`, `staff`, `arrangement` |
| `trainingNotes` | How to get trained or get access | |
| `booking` / `bookingUrl` | How to reserve it, as text and/or a link | |
| `contacts` | People to ask. Leave empty to show the contacts of the makerspace. | |

Tip: when two places have the same kind of machine, give the folders different names, such as `pmb-laser-cutter` and `sc-laser-cutters`. The `title` can simply be "Laser cutter".

### Skills (`src/content/skills`)

| Field | What it is |
|---|---|
| `icon` | One of: `printer-3d`, `laser`, `cnc`, `wood`, `metal`, `electronics`, `scan`, `xr`, `textile`, `plastic`, `paint`, `ceramics`, `camera`, `tools`, `spark` |
| `aliases` | Other names people search for, e.g. `["lasercutting", "lasersnijden"]` |

A skill page shows, automatically, every place, machine, person and project that mentions it.

### People (`src/content/people`)

| Field | What it is | Choices |
|---|---|---|
| `role` | How they are involved | `workshop-staff`, `teacher`, `researcher`, `student`, `other` |
| `skills` | What they can help with | |
| `profileUrl` | Link to a profile page | |
| `email` | E-mail address | |

**Only add people who agreed to be listed**, and only the contact details they want to share. Anyone is removed on request, no questions asked.

### Projects (`src/content/projects`)

| Field | What it is |
|---|---|
| `makers` | Makers who have a page under `people` |
| `credit` | Names of makers without a page |
| `equipment`, `spaces`, `skills` | What was used, where it was made, what it took |
| `year` | When it was made |

Photos and animations in the text sit in the same folder: `![Milling the top](./milling.jpg)`.

## Good to know

- **Getting an id wrong is safe.** If a page mentions a makerspace, skill or person that does not exist, the automatic check stops the change and tells you which file and which name, with the list of valid ones.
- **Photos:** use your own, or ones you may share. Avoid recognisable people unless they agree. Large photos are fine.
- **Tone:** write as if you are explaining it to a new student at the door of the workshop. Practical beats complete.
- **Licence:** text you contribute is published under [CC BY 4.0](LICENSE-CONTENT.md).
