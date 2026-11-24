import { visitorStatistics } from './site-settings.js?v=20261124-owner-visits';
import { visitorRequest } from './visitor-client.js?v=20261018-visitor-api';
import { loadVisitorStatistics, startVisitorRefresh } from './visitor-data.js?v=20261124-owner-visits';
import { readOwnerVisitReturn, startOwnerVisitSignIn } from './visitor-owner.js?v=20261124-owner-visits';

const container = document.querySelector('#visitor-map');
const caption = document.querySelector('#visitor-map-caption');
const totalNode = document.querySelector('#visitor-total');
const regionsNode = document.querySelector('#visitor-regions');
const list = document.querySelector('#visitor-country-list');
const statusNode = document.querySelector('#visitor-status');
const refreshButton = document.querySelector('#visitor-refresh');
const details = document.querySelector('.visitor-details');
const views = [...details.querySelectorAll('.visitor-tab')].map(button => ({
  button, panel: document.getElementById(button.getAttribute('aria-controls')),
}));
const recentPanel = document.getElementById('visitor-recent');
const recentStatus = document.getElementById('visitor-recent-status');
const recentTable = document.getElementById('visitor-recent-table');
const ownerAccessButton = document.getElementById('visitor-owner-access');
const recentView = views.find(view => view.panel === recentPanel);
const recentDate = new Intl.DateTimeFormat('en-US', {
  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  hourCycle: 'h23', timeZone: 'Asia/Shanghai',
});
recentView.button.hidden = !visitorStatistics.ownerVisitsUrl;
const ns = 'http://www.w3.org/2000/svg';
const names = new Intl.DisplayNames(['en'], { type: 'region' });
const number = new Intl.NumberFormat('en');
const regionLabels = { CN: 'Mainland China', TW: 'Taiwan, China', HK: 'Hong Kong, China', MO: 'Macau, China' };
let geometry = [], stats = null, svg, lastResult;
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
function freshSnapshotUrl(path = visitorStatistics.snapshot || './visitor-snapshot.json') {
  const url = new URL(path, import.meta.url);
  url.searchParams.set('refresh', Math.floor(Date.now() / 60000));
  return url;
}

function showRecentStatus(message) {
  recentStatus.textContent = message;
  recentStatus.hidden = !message;
}

function showVisitorView(view) {
  for (const other of views) {
    const active = other === view;
    other.button.setAttribute('aria-expanded', String(active));
    other.panel.hidden = !active;
  }
}

for (const view of views) {
  view.button.addEventListener('click', () => showVisitorView(view.panel.hidden ? view : undefined));
}

ownerAccessButton.addEventListener('click', async () => {
  const publishedHome = new URL('/', visitorStatistics.publishedSnapshot);
  if (location.origin !== publishedHome.origin) {
    publishedHome.hash = 'contact';
    location.assign(publishedHome.href);
    return;
  }
  ownerAccessButton.disabled = true;
  try {
    location.assign(await startOwnerVisitSignIn(visitorStatistics.ownerVisitsUrl, sessionStorage));
  } catch {
    ownerAccessButton.disabled = false;
    showRecentStatus('Could not start sign-in. Please try again.');
  }
});
window.addEventListener('pageshow', () => { ownerAccessButton.disabled = false; });

const returnPrefix = '#owner-visits=';
if (visitorStatistics.ownerVisitsUrl && location.hash.startsWith(returnPrefix)) {
  const result = location.hash.slice(returnPrefix.length);
  history.replaceState(history.state, '', '#contact');
  showVisitorView(recentView);
  requestAnimationFrame(() => document.getElementById('contact').scrollIntoView());
  showRecentStatus('Loading recent visits…');
  void Promise.resolve().then(() => readOwnerVisitReturn(result, sessionStorage)).then(visits => {
    const rows = visits.map(({ country, first_seen }, index) => {
      const row = document.createElement('tr');
      row.insertCell().textContent = String(index + 1);
      row.insertCell().textContent = regionName(country);
      const time = document.createElement('time');
      time.dateTime = first_seen;
      time.textContent = recentDate.format(new Date(first_seen));
      row.insertCell().append(time);
      return row;
    });
    recentTable.tBodies[0].replaceChildren(...rows);
    recentTable.hidden = !rows.length;
    ownerAccessButton.textContent = 'Refresh visits ↻';
    showRecentStatus(rows.length ? '' : 'No recent visits yet.');
  }).catch(error => {
    showRecentStatus(error?.name === 'Error' ? error.message : 'Could not load recent visits. Please try again.');
  });
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
    details.hidden = true;
    return;
  }
  refreshButton.disabled = true;
  try {
    const optedOut = navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true;
    const storage = { getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) };
    const request = visitorRequest({ endpoint: visitorStatistics.endpoint,
      baseUrl: import.meta.url, pageUrl: location.href, optedOut,
      storage,
      randomUUID: () => crypto.randomUUID() });
    const snapshotUrl = freshSnapshotUrl();
    const publishedSnapshotUrl = visitorStatistics.publishedSnapshot
      ? freshSnapshotUrl(visitorStatistics.publishedSnapshot) : undefined;
    await loadVisitorStatistics({ request, storage, snapshotUrl, publishedSnapshotUrl,
      onUpdate(result) {
        details.hidden = false;
        const changed = JSON.stringify(stats) !== JSON.stringify(result.stats);
        stats = result.stats;
        lastResult = result;
        if (changed) renderStats();
        statusNode.hidden = result.mode === 'live';
        if (!statusNode.hidden) {
          const date = new Intl.DateTimeFormat('en-GB', {
            dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC',
          }).format(new Date(result.updatedAt));
          statusNode.textContent = `Saved totals · ${date} UTC`;
          statusNode.title = 'Latest saved totals. Live updates resume when the counter is reachable.';
        }
      },
    });
  } catch {
    if (!stats) {
      totalNode.textContent = '—';
      caption.textContent = 'The visitor map is taking a little break. Please check back soon.';
    }
    statusNode.hidden = false;
    statusNode.textContent = lastResult
      ? `Saved totals · ${new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC',
      }).format(new Date(lastResult.updatedAt))} UTC`
      : 'Waiting for a connection · Retrying automatically';
    statusNode.title = 'The last available totals are kept while the connection is unavailable.';
  } finally {
    refreshButton.disabled = false;
  }
}
fetch(new URL('./assets/world-map.json', import.meta.url)).then(response => {
  if (!response.ok) throw new Error('Map unavailable');
  return response.json();
}).then(data => { geometry = data; drawMap(); }).catch(() => {
  container.textContent = 'Visitor locations are listed below.';
});
if (visitorStatistics.enabled) {
  const refresher = startVisitorRefresh({ async refresh() {
    await loadStats();
  }, document, window });
  refreshButton.addEventListener('click', () => { void refresher.refresh(); });
} else {
  refreshButton.hidden = true;
  loadStats();
}
