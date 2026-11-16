// Builds the GitHub issue forms (.github/ISSUE_TEMPLATE/*.yml) from the form
// definitions in src/forms/definitions.mjs.
import { stringify } from 'yaml';
import { FORMS, labelsOf, templateFile } from '../../src/forms/definitions.mjs';

const HEADER =
  '# This file is generated from src/forms/definitions.mjs.\n' +
  '# Do not edit it by hand: change the definitions and run `npm run forms`.\n';

function field(f) {
  const attributes = { label: f.label };
  if (f.hint) attributes.description = f.hint;
  const validations = f.required ? { validations: { required: true } } : {};
  switch (f.type) {
    case 'textarea':
      return { type: 'textarea', id: f.id, attributes, ...validations };
    case 'photo':
      return { type: 'textarea', id: f.id, attributes: { ...attributes, placeholder: 'Drag a photo here.' } };
    case 'dropdown':
      return { type: 'dropdown', id: f.id, attributes: { ...attributes, options: Object.values(f.options) }, ...validations };
    case 'consent':
      return { type: 'checkboxes', id: f.id, attributes: { label: f.label, options: [{ label: f.option, required: !!f.required }] } };
    default: {
      // input, pick-one and pick-many are all one line of text on GitHub
      if (f.placeholder) attributes.placeholder = f.placeholder;
      return { type: 'input', id: f.id, attributes, ...validations };
    }
  }
}

/** Returns { 'add-space.yml': '…yaml…', … } */
export function issueTemplates() {
  const files = {};
  for (const form of FORMS) {
    const intro = form.collection
      ? 'Thank you for helping! Fill in what you know — only the fields marked with a red star are required. ' +
        'After you submit, a draft page is prepared automatically and a maintainer checks it before it goes live.'
      : 'Thank you for helping! A maintainer will look at your report and update the page.';
    const doc = {
      name: form.title,
      description: form.description,
      title: form.issueTitle,
      labels: labelsOf(form),
      body: [{ type: 'markdown', attributes: { value: intro } }, ...form.fields.map(field)],
    };
    files[templateFile(form)] = HEADER + stringify(doc, { lineWidth: 0 });
  }
  files['config.yml'] = HEADER + stringify({ blank_issues_enabled: true });
  return files;
}
