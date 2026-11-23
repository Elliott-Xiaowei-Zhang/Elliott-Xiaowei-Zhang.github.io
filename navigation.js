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

const profile = document.getElementById('profile');
const educationColumn = profile.querySelector('.profile-education');
const educationList = document.getElementById('education-list');
const cvPanel = document.getElementById('profile-cv');
const cvPages = cvPanel.querySelector('.profile-cv-pages');
const cvClose = document.getElementById('profile-cv-close');
const cvScale = document.getElementById('profile-cv-scale');
const zoomOut = cvPanel.querySelector('[data-cv-zoom="-1"]');
const zoomIn = cvPanel.querySelector('[data-cv-zoom="1"]');
const stackedProfile = matchMedia('(max-width: 700px)');
const cvZoomLevels = [10, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300];
let cvZoomIndex = cvZoomLevels.indexOf(100);

function setCvOpen(open) {
  educationColumn.toggleAttribute('data-cv-open', open);
  cvPanel.inert = !open;
  cvPanel.setAttribute('aria-hidden', String(!open));
  educationList.inert = open;
  for (const link of document.querySelectorAll('[data-open-cv]')) {
    link.setAttribute('aria-expanded', String(open));
  }
}

function closeCv() {
  setCvOpen(false);
  profile.querySelector('[data-open-cv]').focus({preventScroll: true});
}

document.addEventListener('click', event => {
  if (!(event.target instanceof Element)) return;
  const trigger = event.target.closest('[data-open-cv]');
  if (!trigger || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  setCvOpen(true);
  for (const page of cvPages.querySelectorAll('[data-cv-src]')) {
    page.src = page.dataset.cvSrc;
    page.removeAttribute('data-cv-src');
  }
  const fromCover = Boolean(trigger.closest('#home'));
  if (fromCover && location.hash !== '#profile') history.pushState(history.state, '', '#profile');
  if (stackedProfile.matches) educationColumn.scrollIntoView({block: 'start'});
  else if (fromCover) profile.scrollIntoView({block: 'start'});
  cvClose.focus({preventScroll: true});
});
cvClose.addEventListener('click', closeCv);
cvPanel.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeCv();
  }
});
for (const button of [zoomOut, zoomIn]) {
  button.addEventListener('click', () => {
    cvZoomIndex += Number(button.dataset.cvZoom);
    const cvZoom = cvZoomLevels[cvZoomIndex];
    cvScale.value = `${cvZoom}%`;
    cvPages.style.setProperty('--cv-width', `${cvZoom}%`);
    zoomOut.disabled = cvZoomIndex === 0;
    zoomIn.disabled = cvZoomIndex === cvZoomLevels.length - 1;
    if (button.disabled) (button === zoomOut ? zoomIn : zoomOut).focus({preventScroll: true});
  });
}
