// ─────────────────────────────────────────────────────────────────────────────
// Site settings. This is the one file to edit when the site moves, is renamed,
// or gets a new maintainer. Everything else reads from here.
// ─────────────────────────────────────────────────────────────────────────────

export default {
  /** Name shown in the header, page titles and link previews. */
  name: 'Maker Resources',

  /** One-line description used on the home page and in link previews. */
  tagline: 'Find places, machines and people for making at TU Delft.',

  /** Who runs this. Shown in the footer and on the About page. */
  organisation: 'Faculty of Industrial Design Engineering, TU Delft',

  /**
   * The GitHub repository that holds this site, as "owner/name".
   * Used for "Edit this page" links and for submissions.
   * In GitHub Actions this is filled in automatically, so the site keeps
   * working if the repository is renamed or transferred.
   */
  repo: process.env.GITHUB_REPOSITORY || 'Jerzeek/tudelft-maker-resources',

  /** Branch that is published. */
  branch: 'main',

  /**
   * E-mail address that receives submissions from people without a GitHub
   * account. Leave empty to hide the "Send by e-mail" button on the
   * Contribute page. Tip: use a shared mailbox, not a personal address.
   */
  contactEmail: '',

  /**
   * Let search engines list the site? `false` adds a "noindex" tag to every
   * page. Keep it `false` while the site is a
   * pilot, and switch to `true` when you are ready to announce it.
   */
  indexable: false,

  /**
   * A page shows a gentle "is this still correct?" notice when its
   * `lastReviewed` date is older than this many months.
   */
  staleAfterMonths: 12,

  /** Where the map on the Makerspaces page opens: [latitude, longitude], zoom. */
  map: { center: [52.0012, 4.3725], zoom: 15 },
};
