// The map on the Makerspaces page (Leaflet + OpenStreetMap, no API key).
// It only shows pins of places that pass the current filters.
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Pin = { lat: number; lng: number; places: { id: string; title: string; href: string }[] };

const el = document.getElementById('map');
if (el) {
  const pins: Pin[] = JSON.parse(el.dataset.pins ?? '[]');
  const center = JSON.parse(el.dataset.center ?? '[52.0012, 4.3725]');
  const map = L.map(el, { scrollWheelZoom: false }).setView(center, Number(el.dataset.zoom ?? 15));
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
  // Zooming with the scroll wheel only after a click, so the page scrolls normally.
  map.on('click', () => map.scrollWheelZoom.enable());
  map.on('mouseout', () => map.scrollWheelZoom.disable());

  const layer = L.layerGroup().addTo(map);
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  const draw = (visible: Set<string> | null, fit: boolean) => {
    layer.clearLayers();
    const bounds: [number, number][] = [];
    for (const pin of pins) {
      const places = pin.places.filter((p) => !visible || visible.has(p.id));
      if (!places.length) continue;
      bounds.push([pin.lat, pin.lng]);
      const icon = L.divIcon({
        className: '',
        html: `<div class="pin"><span>${places.length > 1 ? places.length : ''}</span></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -28],
      });
      L.marker([pin.lat, pin.lng], { icon, title: places.map((p) => p.title).join(', '), alt: places.map((p) => p.title).join(', ') })
        .bindPopup(
          (places.length > 1 ? `<b>${places.length} places here</b>` : '') +
            places.map((p) => `<a href="${esc(p.href)}">${esc(p.title)}</a>`).join(''),
        )
        .addTo(layer);
    }
    if (fit && bounds.length) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  };

  draw(null, false);
  document.querySelector('[data-filter]')?.addEventListener('filtered', (e) => {
    const ids = new Set<string>((e as CustomEvent).detail.ids);
    const filtered = ids.size < pins.reduce((n, p) => n + p.places.length, 0) || location.search.length > 1;
    draw(ids, filtered);
    if (!filtered) map.setView(center, Number(el.dataset.zoom ?? 15));
  });
}
