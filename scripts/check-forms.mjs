// Part of `npm run check`: fails when the GitHub issue forms no longer match
// src/forms/definitions.mjs (someone changed one but not the other).
import { existsSync, readFileSync } from 'node:fs';
import { issueTemplates } from './lib/issue-templates.mjs';

const dir = new URL('../.github/ISSUE_TEMPLATE/', import.meta.url);
const stale = Object.entries(issueTemplates()).filter(([name, text]) => {
  const file = new URL(name, dir);
  return !existsSync(file) || readFileSync(file, 'utf8') !== text;
});
if (stale.length) {
  console.error(`✖ These GitHub issue forms are out of date: ${stale.map(([n]) => n).join(', ')}`);
  console.error('  Run `npm run forms` and commit the result.');
  process.exit(1);
}
console.log('✔ GitHub issue forms match src/forms/definitions.mjs');
