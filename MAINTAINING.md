# Maintaining the guide

For the people who review submissions and keep the site healthy. Everything here can be done in the browser on GitHub.

## The weekly routine (about ten minutes)

1. **Open the [pull requests](../../pulls).** Each one is a proposed change: either prepared by the submission robot, or made by someone with the *Edit this page* button.
2. For each one, open the **Files changed** tab and read it.
   - Is it correct, friendly and free of private information?
   - Does it name people? Check that they agreed.
   - Work through the checklist the robot left in the description (unknown skills, a photo that needs a credit, …). You can fix things right there with the pencil icon.
3. Check that the automatic check is green, then press **Merge pull request**.
   On pull requests made by the robot, GitHub first shows **Approve and run workflows**: that is a GitHub safety rule for changes made by bots. The robot has already checked that the site builds (it says so at the bottom of the description), so you can merge straight away, or press the button to run the full check once more. The site updates within a few minutes.
4. **Open the [issues](../../issues).** Corrections (label `correction`) need a human: fix the page, then close the issue with a thank-you. Issues labelled `needs-attention` are submissions the robot could not handle; its comment says why.

## How a submission travels

```
Visitor fills in the form on the site
        │
        ├─ "Send with GitHub" ──► a GitHub issue (labels: submission + kind)
        │                               │
        │                        the robot writes the page, checks that the
        │                        site still builds, and opens a pull request
        │                               │
        │                        you review and merge ──► published
        │
        └─ "Send by e-mail" ───► an e-mail to the contact address
                                        │
                                 you click the link in the e-mail, which opens
                                 the same pre-filled GitHub form; add the photo
                                 from the e-mail and submit ──► same route
```

The robot never publishes anything by itself. If it gets something wrong, edit the file in the pull request, or close the pull request and it is as if nothing happened.

**Run the robot again** for an issue (for example after you corrected the issue text): remove the `submission` label and add it back, or go to *Actions → Submission to pull request → Run workflow* and type the issue number.

## The monthly check-up

On the first of each month an issue called **Content check-up** appears. It lists:

- **dead links**,
- **pages not checked for more than a year**: ask the workshop whether the page is still right, update it, and set `lastReviewed` to today,
- **nearly empty pages** and **pages without a photo**: good jobs for new contributors.

You do not have to finish the list. It is replaced by a fresh one next month.

## Keeping pages honest

Every page shows when it was last checked, and warns the reader once that is more than a year ago. The cheapest way to keep the guide alive is to give each workshop's own staff the habit of looking at their page once a year. They can edit it themselves: invite them to the repository (*Settings → Collaborators*) or simply send them the link to their page.

## Settings

All in [`site.config.mjs`](site.config.mjs):

| Setting | What it does |
|---|---|
| `name`, `tagline`, `organisation` | Texts in the header, footer and link previews. |
| `contactEmail` | Turns on the **Send by e-mail** button on the Contribute page, for people without a GitHub account. Use a shared mailbox. Empty = button hidden. |
| `indexable` | `false` asks search engines not to list the site. Switch to `true` when you announce it. |
| `staleAfterMonths` | After how many months a page asks to be checked again. |
| `map` | Where the map on the Makerspaces page opens. |

## Changing the choices and the forms

- **Add a kind of place, access level, role…**: add a line in [`src/forms/vocab.mjs`](src/forms/vocab.mjs). The site, the forms and the checks all follow.
- **Change a submission form**: edit [`src/forms/definitions.mjs`](src/forms/definitions.mjs), then run `npm run forms` and commit the result. (The check on your pull request reminds you if you forget.)
- **Add a field to pages**: add it in [`src/content.config.ts`](src/content.config.ts), then show it on the matching page in `src/pages`.

## Moving or renaming

- **Custom domain** (for example `make.tudelft.nl`): set it under *Settings → Pages → Custom domain*. No change to the code is needed; the address is picked up automatically at the next publish.
- **Renaming or transferring the repository**: works out of the box on GitHub. Update `repo` in `site.config.mjs` so that local builds point to the right place too.

## One-time set-up of a fresh copy

Only needed if you copy this project to a new repository (for another university, say).

1. *Settings → Pages → Source*: **GitHub Actions**.
2. *Settings → Actions → General → Workflow permissions*: tick **Allow GitHub Actions to create and approve pull requests** (the robot needs it).
3. Create the labels the forms use: `submission`, `space`, `equipment`, `project`, `person`, `skill`, `correction`, `needs-attention`, `maintenance`.
4. Edit `site.config.mjs`.

## If something goes wrong

| What you see | What to do |
|---|---|
| A red cross on a pull request | Click *Details*. The message names the file and the problem, for example a skill that does not exist. Fix the file in the pull request. |
| The site did not update after a merge | Look under *Actions → Publish site*. Press *Re-run jobs* if it failed for a reason outside the content. |
| A wrong page went live | Open the file on GitHub and fix it, or use *History → Revert* on the pull request that introduced it. |
| Someone wants to be removed | Delete their folder under `src/content/people` and remove their id from `contacts` / `makers` on other pages (the check tells you where). |
