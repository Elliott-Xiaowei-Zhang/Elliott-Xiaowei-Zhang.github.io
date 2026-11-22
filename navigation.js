const sidebar = document.querySelector('.sidebar');
const bodyMenuToggle = document.getElementById('menu-toggle');
const navigation = document.getElementById('site-navigation');
const coverNavigation = document.getElementById('cover-index-links');
const cover = document.getElementById('home');
const siteBody = document.querySelector('.site-body');
const navigationSlot = document.querySelector('.site-navigation-slot');
const mobileNavigation = matchMedia('(max-width: 950px)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const progress = sidebar.querySelector('.reading-progress span');
const sections = [...document.querySelectorAll('.page-section')];

const bodyLinks = [...navigation.querySelectorAll('a[data-section]')];
const coverLinks = [...coverNavigation.querySelectorAll('a[data-section]')];
const links = [...bodyLinks, ...coverLinks];

function closeBodyMenu() {
  sidebar.classList.remove('open');
  bodyMenuToggle.setAttribute('aria-expanded', 'false');
}

bodyMenuToggle.addEventListener('click', () => {
  const open = sidebar.classList.toggle('open');
  bodyMenuToggle.setAttribute('aria-expanded', String(open));
});
for (const link of bodyLinks) link.addEventListener('click', closeBodyMenu);

document.addEventListener('click', event => {
  if (!(event.target instanceof Element)) return;
  if (!event.target.closest('.sidebar, .mobile-header')) closeBodyMenu();
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !sidebar.classList.contains('open')) return;
  closeBodyMenu();
  bodyMenuToggle.focus();
});

let queuedFrame = false;
function updateNavigationReveal() {
  const entered = innerHeight - cover.getBoundingClientRect().bottom;
  const start = mobileNavigation.matches ? coverNavigation.offsetTop + coverNavigation.offsetHeight + 8 : 40;
  const distance = Math.min(174, Math.max(104, innerHeight * .19));
  const fraction = Math.max(0, Math.min(1, (entered - start) / distance));
  const reveal = reducedMotion.matches ? Number(fraction >= .75) : fraction * fraction * (3 - 2 * fraction);
  const interactive = reveal === 1;

  siteBody.style.setProperty('--navigation-reveal', reveal.toFixed(4));
  siteBody.toggleAttribute('data-aligned', interactive);
  navigationSlot.toggleAttribute('data-visible', reveal > 0);
  if (navigationSlot.inert === interactive) {
    if (!interactive) closeBodyMenu();
    navigationSlot.inert = !interactive;
    navigationSlot.setAttribute('aria-hidden', String(!interactive));
  }
}

function updateNavigation() {
  queuedFrame = false;
  const threshold = Math.min(innerHeight * .3, 230);
  let current = sections[0];
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= threshold) current = section;
  }
  const scrollable = document.documentElement.scrollHeight - innerHeight;
  if (scrollable > 0 && scrollY >= scrollable - 10) current = sections.at(-1);
  updateNavigationReveal();
  for (const link of links) {
    const active = link.dataset.section === current.id;
    link.classList.toggle('current', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
  const percent = scrollable > 0 ? Math.max(0, Math.min(100, scrollY / scrollable * 100)) : 0;
  progress.style.width = `${percent}%`;
}

function queueNavigationUpdate() {
  if (queuedFrame) return;
  queuedFrame = true;
  requestAnimationFrame(updateNavigation);
}

addEventListener('scroll', queueNavigationUpdate, {passive: true});
addEventListener('hashchange', queueNavigationUpdate);
addEventListener('resize', () => {
  if (!mobileNavigation.matches) closeBodyMenu();
  queueNavigationUpdate();
});
reducedMotion.addEventListener('change', queueNavigationUpdate);
new ResizeObserver(queueNavigationUpdate).observe(document.getElementById('main'));
updateNavigation();
