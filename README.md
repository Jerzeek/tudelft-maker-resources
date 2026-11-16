# Maker Resources

One open guide to making at TU Delft: **where** you can build things, **what** machines are there, **which skills** you need, and **who** can help.

Every faculty has its own workshops, labs and experts, but there has never been one overview. This site is that overview. It started as a pilot at the Faculty of Industrial Design Engineering, inspired by [MIT's Project Manus](https://make.mit.edu/), and is meant to grow faculty by faculty.

> This is a community-maintained pilot, not an official TU Delft service.

## How it works, in one minute

- The site is a set of plain text files. **One page = one folder** in [`src/content`](src/content), holding an `index.md` and (optionally) photos.
- There are five kinds of pages: [makerspaces](src/content/spaces), [equipment](src/content/equipment), [skills](src/content/skills), [people](src/content/people) and [projects](src/content/projects). Pages point to each other (a machine names its makerspace, a project names its machines), and the site works out all the cross-links.
- Every change is checked automatically, and the site is rebuilt and published within a few minutes of a change landing on `main`.
- There is no database and no server to look after.

## I want to…

| | |
|---|---|
| **Add a place, a machine, a project or myself** | Use the form on the site's *Contribute* page. No GitHub knowledge needed. |
| **Fix a mistake on a page** | Press *Edit this page* at the bottom of that page. |
| **Understand the fields of a page** | Read [CONTRIBUTING.md](CONTRIBUTING.md). |
| **Review submissions and keep the site healthy** | Read [MAINTAINING.md](MAINTAINING.md). |
| **Change the name, contact address or other settings** | Edit [`site.config.mjs`](site.config.mjs). |

## Running it on your own computer

You only need this to change the design or the code. Content can be edited entirely on GitHub.

Requires [Node.js](https://nodejs.org) 22.23.4 or newer (24 recommended).

```bash
npm install
npm run dev        # the site at http://localhost:4321, updates as you type
```

| Command | What it does |
|---|---|
| `npm run dev` | Start the site locally. |
| `npm run build` | Build the real site into `dist/`. Fails with a readable message if a page is wrong. |
| `npm run check` | Check the code, and that the submission forms are in sync. |
| `npm test` | Test the robot that turns submissions into pages. |
| `npm run new -- space "Name"` | Start a new page with all fields laid out (`space`, `equipment`, `skill`, `person`, `project`). |
| `npm run health -- --links` | Report old pages, nearly empty pages and dead links. |
| `npm run forms` | Regenerate the GitHub submission forms after changing `src/forms/definitions.mjs`. |

## Where things are

```
site.config.mjs          settings: name, repository, contact e-mail, …
src/content/             ← the content. One folder per page.
src/content.config.ts    the rules every page must follow
src/forms/vocab.mjs      the fixed choices (kinds of places, access levels, …)
src/forms/definitions.mjs  the submission forms, defined once
src/pages/               the pages of the site (lists, detail pages, search, contribute)
src/components/          building blocks: cards, icons, filter bar
src/layouts/             the frame around pages
src/styles/global.css    the whole design; colours and sizes are variables at the top
scripts/                 the submission robot, health report and helpers
.github/workflows/       automation: publish, check, submissions, monthly check-up
```

Built with [Astro](https://astro.build) as a static site, hosted on GitHub Pages. The map uses [Leaflet](https://leafletjs.com) and [OpenStreetMap](https://www.openstreetmap.org/copyright); icons are from [Lucide](https://lucide.dev).

## Licence

- **Code**: [MIT](LICENSE).
- **Text and data** in `src/content` and `src/pages`: [CC BY 4.0](LICENSE-CONTENT.md).
- **Photos** belong to the people and organisations credited next to them, and are *not* covered by the licences above.
