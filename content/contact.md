---
title: "Contact"
date: 2026-03-24
hidemeta: true
description: "Xiaowei Zhang's mailing and office addresses."
---


<style>
/* =========================================================
CONTACT — page-scoped styling (matches your editorial theme)
========================================================= */

/* Turn OFF your global editorial left rail ONLY on /contact/ */
html:has(head link[rel="canonical"][href*="/contact"]) .post-content{
border-left: none !important;
padding-left: 0 !important;
}

/* Remove excess header spacing */
.post-single .post-header{ margin-bottom: .2rem !important; }
.post-single .post-content{ padding-top: 0 !important; margin-top: .2rem !important; }

/* Shared card tokens (reuse your theme vars) */
html:has(head link[rel="canonical"][href*="/contact"]) .ct-wrap{
--ct-accent: var(--nk-accent, #500000);
--ct-line: var(--nk-line, rgba(17,24,39,.12));
--ct-paper: var(--nk-paper, #fbfbf9);
--ct-shadow: var(--nk-shadow, 0 10px 30px rgba(17,24,39,.06));
--ct-shadow-sm: var(--nk-shadow-sm, 0 8px 18px rgba(17,24,39,.07));

max-width: 980px;
margin: 0 auto;
}

/* ===== Hero blurb with your underline-gradient border language ===== */
html:has(head link[rel="canonical"][href*="/contact"]) .ct-hero{
position: relative;
border-radius: 16px;
padding: 1.05rem 1.15rem;
background: color-mix(in srgb, var(--ct-paper) 92%, white);
box-shadow: none;
margin: .75rem 0 1.35rem;
overflow: hidden;

/* subtle border */
border: 1px solid var(--ct-line);
}

/* Gradient “ink” border ring (same vibe as your link underline gradient) */
html:has(head link[rel="canonical"][href*="/contact"]) .ct-hero::before{
content:"";
position:absolute;
inset:0;
padding:1px;              /* ring thickness */
border-radius:16px;
background: linear-gradient(
90deg,
var(--linkgreen),
var(--linkgreen)
);
-webkit-mask:
linear-gradient(#000 0 0) content-box,
linear-gradient(#000 0 0);
-webkit-mask-composite: xor;
      mask-composite: exclude;
pointer-events:none;
opacity:.9;
}

/* Dark mode: creamy ring */
body.dark html:has(head link[rel="canonical"][href*="/contact"]) .ct-hero::before{
background: linear-gradient(
90deg,
color-mix(in srgb, #ddd8d8 75%, transparent),
color-mix(in srgb, #ddd8d8 18%, transparent)
);
opacity:.9;
}

html:has(head link[rel="canonical"][href*="/contact"]) .ct-hero p{
margin:0;
line-height:1.7;
color: color-mix(in srgb, currentColor 88%, transparent);
}

/* Floating emoji animation (kept, but smoother) */
html:has(head link[rel="canonical"][href*="/contact"]) .emoji-float{
display:inline-block;
animation: ctFloat 2.9s ease-in-out infinite;
margin-left: .35rem;
}
@keyframes ctFloat{
0%,100%{ transform: translateY(0); }
50%{ transform: translateY(-6px); }
}
@media (prefers-reduced-motion: reduce){
html:has(head link[rel="canonical"][href*="/contact"]) .emoji-float{ animation:none; }
}

/* ===== Grid of cards ===== */
html:has(head link[rel="canonical"][href*="/contact"]) .ct-grid{
display:grid;
grid-template-columns: 1fr 1fr;
gap: 1rem;
margin-top: 1rem;
}
@media (max-width: 860px){
html:has(head link[rel="canonical"][href*="/contact"]) .ct-grid{ grid-template-columns: 1fr; }
}

/* Card */
html:has(head link[rel="canonical"][href*="/contact"]) .ct-card{
position: relative;
border-radius: 16px;
border: 1px solid var(--ct-line);
/* background: #fbfdfc; */
background: #ffffff !important;
padding: 1.05rem 1.15rem;
transition: transform .16s ease, box-shadow .18s ease, border-color .18s ease;
}
html:has(head link[rel="canonical"][href*="/contact"]) .ct-card:hover{
transform: translateY(-2px);
box-shadow: var(--ct-shadow);
border-color: var(--linkgreen);
}
body.dark html:has(head link[rel="canonical"][href*="/contact"]) .ct-card{
/* background: color-mix(in srgb, var(--ct-paper) 88%, black); */
background: #ffffff !important;
}
body.dark html:has(head link[rel="canonical"][href*="/contact"]) .ct-card:hover{
border-color: var(--linkgreen);
}

/* Card header */
html:has(head link[rel="canonical"][href*="/contact"]) .ct-label{
display:flex;
align-items:center;
gap:.55rem;
font-weight: 700;
letter-spacing: .02em;
color: var(--linkgreen);
margin: 0 0 .6rem;
}
body.dark html:has(head link[rel="canonical"][href*="/contact"]) .ct-label{
color:#ddd8d8;
}

html:has(head link[rel="canonical"][href*="/contact"]) .ct-sub{
color: color-mix(in srgb, currentColor 70%, transparent);
margin:0 0 .15rem;
font-size: .98rem;
}

/* Icons (inline SVG) */
html:has(head link[rel="canonical"][href*="/contact"]) .ct-icon{
width: 1.05em;
height: 1.05em;
fill: #4e796b;
opacity: .95;
}

/* Mono fields */
html:has(head link[rel="canonical"][href*="/contact"]) .ct-mono{
/* font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace); */
font-size: .8rem;
overflow-wrap: anywhere;
}

/* Copy button (tiny pill) */
html:has(head link[rel="canonical"][href*="/contact"]) .ct-copy{
border: 1px solid var(--ct-line);
background: transparent;
color: inherit;
border-radius: 999px;
padding: .2rem .4rem;
font-size: .8rem;
cursor: pointer;
transition: transform .14s ease, border-color .18s ease, background .18s ease, color .18s ease;
}
html:has(head link[rel="canonical"][href*="/contact"]) .ct-copy:hover{
transform: translateY(-1px);
border-color: var(--linkgreen);
background: #e6f0e9;
color: var(--linkgreen);
}
body.dark html:has(head link[rel="canonical"][href*="/contact"]) .ct-copy:hover{
border-color: color-mix(in srgb, #ddd8d8 38%, transparent);
background: color-mix(in srgb, #ddd8d8 10%, transparent);
color: #ddd8d8;
}

/* Row for value + copy */
html:has(head link[rel="canonical"][href*="/contact"]) .ct-row{
display:flex;
align-items:center;
gap:.7rem;
flex-wrap: wrap;
}

/* Map card wrapper */
html:has(head link[rel="canonical"][href*="/contact"]) .ct-map{
margin-top: 1.2rem;
border-radius: 16px;
border: 1px solid var(--ct-line);
overflow: hidden;
background: color-mix(in srgb, var(--ct-paper) 92%, white);
transition: transform .16s ease, box-shadow .18s ease, border-color .18s ease;
}
html:has(head link[rel="canonical"][href*="/contact"]) .ct-map:hover{
transform: translateY(-2px);
box-shadow: var(--ct-shadow);
border-color: var(--linkgreen);
}
body.dark html:has(head link[rel="canonical"][href*="/contact"]) .ct-map{
background: color-mix(in srgb, var(--ct-paper) 88%, black);
}
body.dark html:has(head link[rel="canonical"][href*="/contact"]) .ct-map:hover{
border-color: color-mix(in srgb, #ddd8d8 22%, transparent);
}

/* Make iframe fit */
html:has(head link[rel="canonical"][href*="/contact"]) .ct-map iframe{
width:100%;
height: 420px;
border:0;
display:block;
}

/* Optional small note style */
html:has(head link[rel="canonical"][href*="/contact"]) .ct-note{
margin-top: .6rem;
font-size: .95rem;
color: color-mix(in srgb, currentColor 66%, transparent);
}

/* =========================================================
   CONTACT — entrance animation (once on page load)
   Hero + cards + map (staggered)
   ========================================================= */

html:has(head link[rel="canonical"][href*="/contact"]) .ct-hero,
html:has(head link[rel="canonical"][href*="/contact"]) .ct-card,
html:has(head link[rel="canonical"][href*="/contact"]) .ct-map{
  opacity: 0;
  transform: translateY(10px) scale(.985);
  animation: ct-in 0.85s ease-out forwards;
  will-change: opacity, transform;
}

/* Stagger */
html:has(head link[rel="canonical"][href*="/contact"]) .ct-hero{ animation-delay: .06s; }
html:has(head link[rel="canonical"][href*="/contact"]) .ct-grid .ct-card:nth-child(1){ animation-delay: .14s; }
html:has(head link[rel="canonical"][href*="/contact"]) .ct-grid .ct-card:nth-child(2){ animation-delay: .22s; }
html:has(head link[rel="canonical"][href*="/contact"]) .ct-map{ animation-delay: .30s; }

@keyframes ct-in{
  from{
    opacity: 0;
    transform: translateY(10px) scale(.985);
  }
  to{
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce){
  html:has(head link[rel="canonical"][href*="/contact"]) .ct-hero,
  html:has(head link[rel="canonical"][href*="/contact"]) .ct-card,
  html:has(head link[rel="canonical"][href*="/contact"]) .ct-map{
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}

</style>



<!-- ======================================================
  Inline SVG icons (reusable)
  ====================================================== -->
<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
<symbol id="ct-mail" viewBox="0 0 24 24">
<path d="M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 2v.01l9 5.49 9-5.5V7H3zm0 2.51V17h18V9.5l-9 5.5-9-5.49z"/>
</symbol>
<symbol id="ct-pin" viewBox="0 0 24 24">
<path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
</symbol>
<symbol id="ct-clock" viewBox="0 0 24 24">
<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 11h5v-2h-4V7h-2v6z"/>
</symbol>
</svg>

<div class="ct-wrap">

Interested in my work or looking to collaborate? Feel free to get in touch via email! <span class="emoji-float">✉️</span>

<!-- <div class="ct-hero">
<p>
  Interested in my work or looking to collaborate? Feel free to get in touch via email!
  <span class="emoji-float">✉️</span>
</p>
</div> -->

<div class="ct-grid">

<div class="ct-card">
  <div class="ct-label">
    <svg class="ct-icon"><use href="#ct-mail"/></svg>
    Email Address
  </div>
  <p class="ct-sub"></p>
  <div class="ct-row">
    <span class="ct-mono" id="ct-email"> xw-zhang21@mails.tsinghua.edu.cn</span>
    <button class="ct-copy" type="button" data-copy="#ct-email">Copy</button>
    <span class="ct-mono" id="ct-email">xzhangkn@connect.ust.hk</span>
    <button class="ct-copy" type="button" data-copy="#ct-email">Copy</button>
  </div>
</div>

<div class="ct-card">
  <div class="ct-label">
    <svg class="ct-icon"><use href="#ct-pin"/></svg>
    Office Location
  </div>
  <p class="ct-sub"></p>
  <div class="ct-row">
    <span class="ct-mono" id="ct-office">
        RM 431, Lihua Building<br>
        School of Economics and Management,
        Tsinghua University<br>
        30 Shuangqing Road,  
        Haidian, Beijing, China
    </span>
    <!-- <button class="ct-copy" type="button" data-copy="#ct-office">Copy</button> -->
  </div>
  <!-- <div class="ct-note">If you’re visiting campus, the map below points to the department.</div> -->
</div>

</div>

<div class="ct-map" aria-label="Map to the School of Economics and Management, Tsinghua University">
<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3056.3973520348886!2d116.329416075716!3d39.99957108092402!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x35f05419217198c7%3A0xff56d69121ccce6e!2z5riF5Y2O5aSn5a2m57uP5rWO566h55CG5a2m6Zmi!5e0!3m2!1szh-CN!2ssg!4v1774448833091!5m2!1szh-CN!2ssg" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
</div>

</div>

<script>
/* Tiny copy-to-clipboard helper (safe if clipboard is blocked) */
document.addEventListener("DOMContentLoaded", () => {
document.querySelectorAll(".ct-copy[data-copy]").forEach((btn) => {
btn.addEventListener("click", async () => {
  const sel = btn.getAttribute("data-copy");
  const el  = document.querySelector(sel);
  if (!el) return;

  const text = el.innerText.replace(/\n{2,}/g, "\n").trim();

  try{
    await navigator.clipboard.writeText(text);
    const old = btn.textContent;
    btn.textContent = "Copied ✓";
    setTimeout(() => (btn.textContent = old), 900);
  }catch(e){
    // Fallback: select + copy
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);

    const old = btn.textContent;
    btn.textContent = "Copied ✓";
    setTimeout(() => (btn.textContent = old), 900);
  }
});
});
});
</script>




<!-- <iframe src="https://www.google.com/maps/embed/v1/place?q=%E6%B8%85%E5%8D%8E%E5%A4%A7%E5%AD%A6%E7%BB%8F%E6%B5%8E%E7%AE%A1%E7%90%86%E5%AD%A6%E9%99%A2&key=AIzaSyDTGCaNTRTf4iGbb0zs4ovQ4gtIOxZLNW4" 
width="700" height="400" style="border:0;" allowfullscreen="" loading="lazy"></iframe> -->



