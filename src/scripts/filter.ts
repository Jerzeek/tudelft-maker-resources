// Filtering for the overview pages. No framework: it reads a few attributes.
//
//   <section data-filter>
//     <input data-f="q">                     free-text search
//     <select data-f="skill">                 one <select> per filter
//     <li data-item data-text="…" data-skill="a|b">   the things to filter
//     <span data-count>                       "12 of 30"
//     <div data-empty hidden>                 shown when nothing matches
//
// The chosen filters are kept in the address bar (?skill=electronics), so a
// filtered view can be bookmarked and linked to from other pages.

const norm = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

for (const root of document.querySelectorAll<HTMLElement>('[data-filter]')) {
  const controls = [...root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-f]')];
  const items = [...root.querySelectorAll<HTMLElement>('[data-item]')];
  const count = root.querySelector<HTMLElement>('[data-count]');
  const empty = root.querySelector<HTMLElement>('[data-empty]');
  const reset = root.querySelectorAll<HTMLElement>('[data-reset]');

  const params = new URLSearchParams(location.search);
  for (const c of controls) {
    const v = params.get(c.dataset.f!);
    if (v !== null) c.value = v;
    // An unknown value in the address bar falls back to "all".
    if (c instanceof HTMLSelectElement && c.selectedIndex < 0) c.value = '';
  }

  const apply = () => {
    let shown = 0;
    const active = controls.filter((c) => c.value.trim() !== '');
    for (const item of items) {
      const ok = active.every((c) => {
        const key = c.dataset.f!;
        if (key === 'q') {
          const text = norm(item.dataset.text ?? '');
          return norm(c.value).split(/\s+/).filter(Boolean).every((word) => text.includes(word));
        }
        return (item.dataset[key] ?? '').split('|').includes(c.value);
      });
      item.hidden = !ok;
      if (ok) shown++;
    }
    if (count) count.textContent = shown === items.length ? `${items.length} in total` : `${shown} of ${items.length}`;
    if (empty) empty.hidden = shown > 0;
    for (const r of reset) r.hidden = active.length === 0;

    const next = new URLSearchParams();
    for (const c of active) next.set(c.dataset.f!, c.value.trim());
    const qs = next.toString();
    history.replaceState(null, '', location.pathname + (qs ? `?${qs}` : '') + location.hash);
    root.dispatchEvent(new CustomEvent('filtered', { detail: { ids: items.filter((i) => !i.hidden).map((i) => i.dataset.id) } }));
  };

  for (const c of controls) c.addEventListener(c instanceof HTMLSelectElement ? 'change' : 'input', apply);
  for (const r of reset)
    r.addEventListener('click', () => {
      for (const c of controls) c.value = '';
      apply();
    });
  root.querySelector('form')?.addEventListener('submit', (e) => e.preventDefault());
  apply();
}
