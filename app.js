const one = (selector, root = document) => root.querySelector(selector);
const all = (selector, root = document) => [...root.querySelectorAll(selector)];
const safe = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const researchAuthorLinks = new Map([
  ['Zhijie Lin', 'https://www.sem.tsinghua.edu.cn/info/1210/31859.htm'],
  ['Jing Wang', 'https://isom.hkust.edu.hk/faculty-and-staff/directory/jwang'],
  ['Siliang (Jack) Tong', 'https://dr.ntu.edu.sg/entities/person/Jack-Tong'],
  ['Siliang Tong', 'https://dr.ntu.edu.sg/entities/person/Jack-Tong'],
  ['Xueming Luo', 'https://www.fox.temple.edu/directory/xueming-luo-tuf35198'],
  ['Jing (Aaron) Li', 'https://neoma-bs.com/professors/li-jing'],
  ['Jing Li', 'https://neoma-bs.com/professors/li-jing'],
  ['Jason Chan', 'https://carlsonschool.umn.edu/faculty/jason-chan'],
  ['Yi Wu', 'https://come.tju.edu.cn/info/1089/3755.htm'],
  ['吴懿', 'https://come.tju.edu.cn/info/1089/3755.htm'],
]);
const researchCoauthorText = value => String(value ?? '').split(/(,\s*)/).map(name => {
  const url = researchAuthorLinks.get(name);
  return url ? `<a class="research-author-link" href="${safe(url)}" target="_blank" rel="noopener noreferrer">${safe(name)}<span class="research-author-arrow" aria-hidden="true">↗</span></a>` : safe(name);
}).join('');
const authorText = (value, equalContributors = []) => {
  let text = researchCoauthorText(value).replace(/Xiaowei \(Elliott\) Zhang|Xiaowei Zhang/g, '<strong>$&</strong>');
  for (const name of equalContributors) text = text.replace(safe(name), safe(name)+'<sup class="equal-contribution" aria-label="Equal contribution">†</sup>');
  return text;
};
const outlink = (text, url) => `<a href="${safe(url)}" target="_blank" rel="noopener noreferrer">${safe(text)} <span aria-hidden="true">↗</span></a>`;
const personLink = (name, url) => `<a class="person-link" href="${safe(url)}" target="_blank" rel="noopener noreferrer">${safe(name)} <span aria-hidden="true">↗</span></a>`;
const dataResponse = await fetch(new URL('./data.json', import.meta.url), {cache:'no-cache'});
if (!dataResponse.ok) throw new Error('Academic information could not be loaded.');
const data = await dataResponse.json();

const typeNames = {journal:'Journal publication', working:'Working paper', conference:'Conference proceedings'};
const translatedTitles = new Set();
function titleMarkup(item, className = '') {
  if (!item.title_zh) return '<h3 class="'+className+'">'+safe(item.title)+'</h3>';
  const translated = translatedTitles.has(item.title);
  const action = translated ? 'Show English title' : 'Show Chinese title';
  const current = translated ? item.title_zh : item.title;
  return '<h3 class="'+className+' bilingual-title"><button type="button" class="title-flip'+(translated?' is-translated':'')+'" data-title-flip="'+safe(item.title)+'" data-title-zh="'+safe(item.title_zh)+'" aria-pressed="'+translated+'" aria-label="'+safe(current+' — '+action)+'"><span class="title-flip-scene" aria-hidden="true"><span class="title-flip-faces"><span class="title-face title-face-en" lang="en">'+safe(item.title)+'</span><span class="title-face title-face-zh" lang="zh-CN">'+safe(item.title_zh)+'</span></span></span></button></h3>';
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-title-flip]');
  if (!button) return;
  const key = button.dataset.titleFlip;
  const translated = !translatedTitles.has(key);
  translated ? translatedTitles.add(key) : translatedTitles.delete(key);
  all('[data-title-flip]').filter(node => node.dataset.titleFlip === key).forEach(node => {
    const action = translated ? 'Show English title' : 'Show Chinese title';
    node.classList.toggle('is-translated', translated);
    node.setAttribute('aria-pressed', String(translated));
    node.setAttribute('aria-label', (translated ? node.dataset.titleZh : key)+' — '+action);
  });
});
let activeCategory = 'selected';
const locationMarkup = item => item.location ? '<span class="event-location"><span class="flag" role="img" aria-label="'+safe(item.country||'')+'">'+safe(item.flag||'')+'</span>'+safe(item.location)+'</span>' : '';
function abstractMarkup(p) {
  const content = p.abstract || p.overview || '';
  return content.split(/\n\s*\n/).map(paragraph=>'<p>'+safe(paragraph).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')+'</p>').join('');
}
const paperLinkLabels = {'Journal article':'Paper','Read the paper':'Paper','Read on arXiv':'Paper','SSRN record':'SSRN','Related working paper':'Related paper','Related journal article':'Related paper'};
function paperMarkup(p) {
  const ranks = p.classification ? '<span class="journal-ranks" aria-label="Journal rankings">'+p.classification.split(';').map(r=>'<span>'+safe(r.trim())+'</span>').join('')+'</span>' : '';
  const source = p.type === 'working' ? p.status : p.venue;
  const statusParts = p.type === 'working' ? source?.match(/^(In preparation to submit to|Under review at) (.+)$/) : null;
  const sourceMarkup = statusParts ? '<span class="status-prefix">'+safe(statusParts[1])+'</span> <span class="status-journal">'+safe(statusParts[2])+'</span>' : safe(source)+(p.type==='journal' && p.status ? ' <span class="status-prefix publication-outcome">· '+safe(p.status)+'</span>' : '');
  const language = p.language_label ? '<span class="publication-language">'+safe(p.language_label)+'</span>' : '';
  const venue = source ? '<div class="publication-heading"><div class="publication-venue'+(p.type==='working'?' publication-status':'')+'"><span class="venue-label">'+sourceMarkup+'</span>'+language+'</div>'+ranks+'</div>' : '';
  const caption = p.abstract ? 'Abstract' : 'Research summary';
  const disclosure = (p.abstract || (p.type !== 'conference' && p.overview)) ? '<div class="paper-actions"><details class="paper-abstract"><summary><span class="abstract-label">'+caption+'</span><span class="abstract-toggle" aria-hidden="true">＋</span></summary><div class="abstract-content">'+abstractMarkup(p)+(p.note?'<p class="paper-note">'+safe(p.note)+'</p>':'')+'</div></details></div>' : '';
  const links = p.links.map(([label,url])=>outlink(paperLinkLabels[label] || label,url)).join('');
  return '<article class="paper '+(p.id==='paper-1'?'featured':'')+'" id="'+p.id+'"><div class="paper-margin"><span class="paper-year">'+safe(p.year)+'</span><span class="publication-type type-'+p.type+'">'+typeNames[p.type]+'</span>'+locationMarkup(p)+'</div><div class="paper-body">'+venue+titleMarkup(p,'paper-title')+'<p class="paper-authors">'+authorText(p.authors,p.equal_contributors)+'</p><div class="paper-topics">'+p.tags.map(t=>'<span>'+safe(t)+'</span>').join('')+'</div>'+disclosure+'</div><div class="paper-links" aria-label="Resources for '+safe(p.title)+'">'+links+'</div></article>';
}
function ongoingProjectsMarkup() {
  const projects = data.ongoing_projects || [];
  if (!projects.length) return '';
  return '<section class="ongoing-projects" aria-labelledby="ongoing-projects-heading"><div class="ongoing-heading"><h3 id="ongoing-projects-heading">Ongoing projects</h3><span class="eyebrow">'+String(projects.length).padStart(2,'0')+' PROJECTS</span></div><div class="ongoing-list">'+projects.map((project,index)=>'<article class="ongoing-project"><span class="project-index" aria-hidden="true">'+String(index+1).padStart(2,'0')+'</span><div><h4>'+safe(project.title)+'</h4><p class="project-collaborators">with '+researchCoauthorText(project.collaborators)+'</p></div></article>').join('')+'</div></section>';
}
function showPapers() {
  const papers=data.papers.filter(p=>activeCategory==='selected'?p.selected:p.type===activeCategory);
  const ongoing = activeCategory==='working' ? data.ongoing_projects || [] : [];
  one('#paper-list').innerHTML=papers.map(paperMarkup).join('')+(ongoing.length?ongoingProjectsMarkup():'');
  one('#result-count').textContent=String(papers.length).padStart(2,'0')+' PAPERS'+(ongoing.length?' · '+String(ongoing.length).padStart(2,'0')+' ONGOING PROJECTS':'');
  all('[data-filter]').forEach(button=>{
    const current=button.dataset.filter===activeCategory;
    const category=button.dataset.filter;
    const count=data.papers.filter(p=>category==='selected'?p.selected:p.type===category).length;
    const ongoingCount=(data.ongoing_projects || []).length;
    button.querySelector('sup').textContent=String(count).padStart(2,'0')+(category==='working'?'+'+String(ongoingCount).padStart(2,'0'):'');
    if(category==='working') button.setAttribute('aria-label','Work in progress: '+count+' working papers and '+ongoingCount+' ongoing projects');
    button.classList.toggle('selected',current);
    button.setAttribute('aria-pressed',String(current));
  });
}
all('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  activeCategory=button.dataset.filter;
  showPapers();
}));
showPapers();

function courseworkMarkup(courses) {
  if (!courses?.length) return '';
  return `<details class="education-coursework"><summary><span>Relevant coursework</span><span class="coursework-toggle" aria-hidden="true">＋</span></summary><div class="coursework-content"><table aria-label="Relevant coursework, disciplines, grades, and instructors"><colgroup><col class="coursework-discipline-col"><col class="coursework-title-col"><col class="coursework-grade-col"><col class="coursework-instructor-col"></colgroup><thead><tr><th scope="col">Discipline</th><th scope="col">Course</th><th scope="col">Grade</th><th scope="col">Instructor</th></tr></thead><tbody>${courses.map(c=>`<tr><td class="coursework-discipline">${safe(c.discipline)}</td><td>${safe(c.title)}</td><td class="coursework-grade">${safe(c.grade)}</td><td>${safe(c.instructor)}</td></tr>`).join('')}</tbody></table></div></details>`;
}
one('#education-list').innerHTML=data.education.map(e=>`<article class="education-item"><div class="education-meta"><span>${safe(e.years).toUpperCase()}</span><span>${safe(e.location)}</span></div><h3>${safe(e.institution)}</h3><p>${safe(e.degree)}${e.detail?`<span class="education-detail">${safe(e.detail)}</span>`:''}</p><div class="education-note">${e.advisor?`<span>Advisor · ${personLink(e.advisor,e.url)}</span>`:''}${e.gpa?`<span>GPA ${safe(e.gpa)}</span>`:''}${e.note?`<span>${safe(e.note)}</span>`:''}</div>${courseworkMarkup(e.coursework)}</article>`).join('');
function honorMarkup(h){return `<div class="honor"><div><h4>${safe(h.title)}</h4><p>${safe(h.source)}</p></div><span>${safe(h.date)}</span></div>`;}
one('#honor-grid').innerHTML=data.honors.map(honorMarkup).join('');
function instructorMarkup(c) {
  const links=[...c.instructor_links].sort((a,b)=>b.name.length-a.name.length);
  if (!links.length) return safe(c.instructor);
  const escapedNames=links.map(link=>link.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  const pattern=new RegExp('('+escapedNames.join('|')+')','g');
  return c.instructor.split(pattern).map(part=>{
    const link=links.find(item=>item.name===part);
    return link ? personLink(part,link.url) : safe(part);
  }).join('');
}
function courseMarkup(c) {
  const language=c.language?'<span class="language-tag" aria-label="Medium of instruction: English"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7"/><ellipse cx="10" cy="10" rx="3" ry="7"/><path d="M3 10h14"/></svg>MOI · English</span>':'';
  return '<details class="course"><summary><span class="course-level">'+safe(c.level)+'</span><span class="course-title">'+safe(c.title)+'</span><span class="course-time">'+safe(c.time.replace(/;\s*/g,' · '))+'</span><span class="course-toggle" aria-hidden="true">＋</span></summary><div class="course-content"><div class="course-position"><strong>Teaching Assistant</strong>'+(c.role_tag?'<span class="role-tag">'+safe(c.role_tag)+'</span>':'')+language+'</div><p class="course-institution">'+safe(c.location)+'</p><p class="course-instructors">Instructor'+((c.instructor_links.length>1 || /partners|companies/i.test(c.instructor))?'s':'')+': '+instructorMarkup(c)+'</p>'+(c.extra?'<p>'+safe(c.extra)+'</p>':'')+'</div></details>';
}
one('#course-list').innerHTML=data.courses.map(courseMarkup).join('');
const offerings=data.courses.reduce((total,course)=>total+(course.time.match(/\d{4}/g)||[]).length,0);
one('#teaching-summary').textContent=data.courses.length+' courses across '+offerings+' offerings';
function editorialMarkup(s) {
  return '<div class="editor-record"><p>'+safe(s.title)+(s.special_issue?'<span class="editor-special-issue">: Special Issue on <em>'+safe(s.special_issue)+'</em></span>':'')+(s.track?'<small class="editor-track">'+safe(s.track)+'</small>':'')+'</p><span>'+safe(s.time)+'</span></div>';
}
one('#editorial-list').innerHTML=data.service.filter(s=>s.category==='editorial').reverse().map(editorialMarkup).join('');
one('#associate-list').innerHTML=data.service.filter(s=>s.category==='associate').map(editorialMarkup).join('');
one('#journal-list').innerHTML=data.service.filter(s=>s.category==='journal-review').map(s=>`<div class="reviewer-row"><p>${safe(s.title)}</p></div>`).join('');
one('#review-list').innerHTML=data.service.filter(s=>s.category==='conference-review').map(s=>{
  const abbreviation=(s.title.match(/\(([^)]+)\)/)||[])[1]||s.title;
  const fullName=s.title.replace(/\s*\([^)]+\)/g,'');
  return '<div class="reviewer-row"><p><strong>'+safe(abbreviation)+'</strong><span class="conference-full-name"> — '+safe(fullName)+'</span></p><span>'+safe(s.time)+'</span></div>';
}).join('');
function talkMarkup(t) {
  const named=t.source.match(/\(([A-Z][A-Z-]+)\s*(\d{4})\)/);
  const leading=t.source.match(/^(\d{4})\s+([A-Z]{2,}(?:-[A-Z]{2,})*)\b/);
  const label=named ? named[1]+' '+named[2] : leading ? leading[2]+' '+leading[1] : '';
  return '<article class="talk-row"><div class="talk-date">'+safe(t.year)+locationMarkup(t)+'</div><div>'+titleMarkup(t)+'<p>'+safe(t.source)+'</p></div>'+(label?'<span class="talk-year">'+safe(label)+'</span>':'')+'</article>';
}
const recentTalks=data.talks.slice(0,3);
one('#recent-talks').innerHTML=recentTalks.map(talkMarkup).join('');
one('#earlier-talks').innerHTML=data.talks.slice(3).map(talkMarkup).join('');
one('.talk-archive small').textContent=data.talks.length+' presentations';
let activeTalkCategory='recent';
const talkCategories={conference:'conferences',workshop:'workshop and symposium presentations',consortium:'consortium and forum presentations'};
all('[data-talk-filter]').forEach(button=>{
  const category=button.dataset.talkFilter;
  const count=category==='recent'?recentTalks.length:data.talks.filter(t=>t.category===category).length;
  one('sup',button).textContent=String(count).padStart(2,'0');
  button.addEventListener('click',()=>{
    if(activeTalkCategory===category)return;
    activeTalkCategory=category;
    showTalks();
  });
});
function showTalks(){
  const recent=activeTalkCategory==='recent';
  one('#talk-recent-view').hidden=!recent;
  one('#categorized-talks').hidden=recent;
  if(!recent){
    const talks=data.talks.filter(t=>t.category===activeTalkCategory);
    one('#categorized-talks').innerHTML=talks.map(talkMarkup).join('');
    one('#talk-status').textContent=talks.length+' '+talkCategories[activeTalkCategory]+'.';
  }else{
    one('#talk-status').textContent=recentTalks.length+' recent presentations. The full record is available below.';
  }
  all('[data-talk-filter]').forEach(button=>{
    const current=button.dataset.talkFilter===activeTalkCategory;
    button.classList.toggle('selected',current);
    button.setAttribute('aria-pressed',String(current));
  });
}
showTalks();

const sidebar=one('.sidebar'),menu=one('#menu-toggle');
function closeMenu(){sidebar.classList.remove('open');menu.setAttribute('aria-expanded','false');}
menu.addEventListener('click',()=>{const opened=sidebar.classList.toggle('open');menu.setAttribute('aria-expanded',String(opened));});
all('#site-navigation a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('click',event=>{if(!event.target.closest('.sidebar,.mobile-header'))closeMenu();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&sidebar.classList.contains('open')){closeMenu();menu.focus();}});
const sectionNodes=all('.page-section');
let queuedFrame=false;
function updateNavigation(){
  queuedFrame=false;
  const threshold=Math.min(innerHeight*.3,230);
  let section=sectionNodes[0];
  for(const node of sectionNodes)if(node.getBoundingClientRect().top<=threshold)section=node;
  if(scrollY+innerHeight>=document.documentElement.scrollHeight-10)section=sectionNodes.at(-1);
  all('#site-navigation a').forEach(link=>{const active=link.dataset.section===section.id;link.classList.toggle('current',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  const total=document.documentElement.scrollHeight-innerHeight;
  one('.reading-progress span').style.width=`${total>0?Math.min(100,scrollY/total*100):0}%`;
}
addEventListener('scroll',()=>{if(!queuedFrame){queuedFrame=true;requestAnimationFrame(updateNavigation);}},{passive:true});
addEventListener('resize',()=>{if(innerWidth>950)closeMenu();updateNavigation();});
updateNavigation();
let toastTimer;
function announce(text){const toast=one('.toast');toast.textContent=text;toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),3200);}
all('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(button.dataset.copy);button.textContent='Copied';announce('Email address copied.');setTimeout(()=>button.textContent='Copy',2000);}
  catch{const range=document.createRange();range.selectNodeContents(button.previousElementSibling);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);announce('Email selected. Use your device’s Copy command.');}
}));
