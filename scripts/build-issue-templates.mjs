// Writes the GitHub issue forms. Run with:  npm run forms
import { mkdirSync, writeFileSync } from 'node:fs';
import { issueTemplates } from './lib/issue-templates.mjs';

const dir = new URL('../.github/ISSUE_TEMPLATE/', import.meta.url);
mkdirSync(dir, { recursive: true });
for (const [name, text] of Object.entries(issueTemplates())) {
  writeFileSync(new URL(name, dir), text);
  console.log(`wrote .github/ISSUE_TEMPLATE/${name}`);
}
