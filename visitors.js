import { visitorStatistics } from './site-settings.js?v=20261021-resilient-visitors';
import { visitorRequest } from './visitor-client.js?v=20261018-visitor-api';
import { loadVisitorStatistics } from './visitor-data.js?v=20261021-resilient-visitors';

const container = document.querySelector('#visitor-map');
const caption = document.querySelector('#visitor-map-caption');
const totalNode = document.querySelector('#visitor-total');
const regionsNode = document.querySelector('#visitor-regions');
const list = document.querySelector('#visitor-country-list');
const statusNode = document.querySelector('#visitor-status');
const ns = 'http://www.w3.org/2000/svg';
const names = new Intl.DisplayNames(['en'], { type: 'region' });
const number = new Intl.NumberFormat('en');
const regionLabels = { CN: 'Mainland China', TW: 'Taiwan, China', HK: 'Hong Kong, China', MO: 'Macau, China' };
let geometry = [], stats = null, svg;
const countries = new Map();
function element(tag, attrs = {}) {
  const node = document.createElementNS(ns, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}
function regionName(code) {
  if (code === 'ZZ') return 'Location unavailable';
  if (regionLabels[code]) return regionLabels[code];
  try { return names.of(code) || code; } catch { return code; }
}
function describe(code) {
  if (!stats) return;
  const count = countries.get(code) || 0;
  caption.textContent = `${regionName(code)} · ${number.format(count)} ${count === 1 ? 'visitor' : 'visitors'}`;
  container.querySelectorAll('[data-country]').forEach(node => node.classList.toggle('active', node.dataset.country === code));
}
function bindCountry(node, code) {
  node.dataset.country = code;
  node.addEventListener('pointerenter', () => describe(code));
  node.addEventListener('focus', () => describe(code));
  node.addEventListener('click', () => describe(code));
  node.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); describe(code); }
  });
}
function drawMap() {
  if (!geometry.length) return;
  svg = element('svg', { viewBox: '0 0 360 155', role: 'group', 'aria-label': 'World map of visitor countries and regions' });
  for (const place of geometry) {
    if (!place.path) continue;
    const path = element('path', { d: place.path, class: 'map-country', 'aria-label': regionLabels[place.code] || place.name });
    bindCountry(path, place.code);
    svg.append(path);
  }
  container.replaceChildren(svg);
  renderStats();
}
function renderStats() {
  if (!stats) return;
  countries.clear();
  stats.countries.forEach(row => countries.set(row.country, row.visitors));
  totalNode.textContent = number.format(stats.total);
  document.querySelector('#visitor-noun').textContent = stats.total === 1 ? 'visitor' : 'visitors';
  const count = stats.countries.filter(row => row.country !== 'ZZ').length;
  regionsNode.textContent = `${count} ${count === 1 ? 'country / region' : 'countries / regions'}`;
  caption.textContent = stats.total ? 'A small map of the people stopping by. Hover or tap to explore.' : 'Waiting for the first little hello.';
  if (svg) {
    svg.querySelectorAll('.map-marker').forEach(node => node.remove());
    svg.querySelectorAll('.map-country').forEach(node => node.classList.toggle('visited', countries.has(node.dataset.country)));
    for (const place of geometry) {
      const visits = countries.get(place.code);
      if (!visits) continue;
      const marker = element('circle', { cx: place.x, cy: place.y, r: 2.5 + Math.min(3.5, Math.log2(visits + 1) * .65), class: 'map-marker', tabindex: '0', role: 'button', 'aria-label': `${regionName(place.code)}: ${visits} ${visits === 1 ? 'visitor' : 'visitors'}` });
      bindCountry(marker, place.code);
      svg.append(marker);
    }
  }
  list.replaceChildren();
  for (const row of stats.countries) {
    const item = document.createElement('li'), button = document.createElement('button');
    button.type = 'button';
    const name = document.createElement('span'), count = document.createElement('span');
    name.textContent = regionName(row.country); count.textContent = number.format(row.visitors);
    button.append(name, count); button.addEventListener('click', () => describe(row.country));
    item.append(button); list.append(item);
  }
}
async function loadStats() {
  if (!visitorStatistics.enabled) {
    totalNode.textContent = '—';
    regionsNode.textContent = 'From near & far';
    caption.textContent = 'More little hellos to come.';
    document.querySelector('.visitor-details').hidden = true;
    return;
  }
  try {
    const optedOut = navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true;
    const storage = { getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) };
    const request = visitorRequest({ endpoint: visitorStatistics.endpoint,
      baseUrl: import.meta.url, pageUrl: location.href, optedOut,
      storage,
      randomUUID: () => crypto.randomUUID() });
    await loadVisitorStatistics({ request, storage,
      snapshotUrl: new URL(visitorStatistics.snapshot || './visitor-snapshot.json', import.meta.url),
      onUpdate(result) {
        document.querySelector('.visitor-details').hidden = false;
        stats = result.stats; renderStats();
        statusNode.hidden = result.mode === 'live';
        if (!statusNode.hidden) {
          const date = new Intl.DateTimeFormat('en-GB', {
            dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC',
          }).format(new Date(result.updatedAt));
          statusNode.textContent = `Updated ${date} UTC`;
          statusNode.title = 'Latest saved totals. Live updates resume when the counter is reachable.';
        }
      },
    });
  } catch {
    totalNode.textContent = '—';
    caption.textContent = 'The visitor map is taking a little break. Please check back soon.';
  }
}
fetch(new URL('./assets/world-map.json', import.meta.url)).then(response => {
  if (!response.ok) throw new Error('Map unavailable');
  return response.json();
}).then(data => { geometry = data; drawMap(); }).catch(() => {
  container.textContent = 'Visitor locations are listed below.';
});
loadStats();
