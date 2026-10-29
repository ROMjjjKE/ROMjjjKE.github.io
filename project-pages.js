import {pixelCard} from './card-effects.js';
import {PROJECT_SLUGS} from './project-registry.js';
export {PROJECT_SLUGS};
export function createProjectPages(reduced,onBack){
 const root=document.querySelector('.case-studies');let observer,warmObserver,effects=new WeakMap(),active=false,paused=reduced.matches,generation=0,animations=[];
 const visibleVideos=new Set();
 let firstStart=true,serviceOrigin=null;
 try{const ref=new URL(document.referrer);if(ref.origin===location.origin&&/^\/projects\/[^/]+\/?$/.test(location.pathname)&&['/best-branding/','/websites/','/mobile-apps-saas-design/','/full-product-design/'].includes(ref.pathname))serviceOrigin=ref.pathname;}catch{}
 const back=()=>{if(serviceOrigin){if(history.length>1)history.back();else location.assign(serviceOrigin);}else onBack();};
 if(serviceOrigin)root.querySelectorAll('.case-back,.case-return').forEach(link=>{link.href=serviceOrigin;const label=link.querySelector('span');if(label)label.textContent='Back to service';});
 function media(){root.querySelectorAll('video').forEach(v=>{if(active&&!paused&&!document.hidden&&visibleVideos.has(v)){if(!v.src){v.src=v.dataset.src;v.load();}v.play().catch(()=>{});}else v.pause();});}
 function prepareBlock(block){
  let prepared=effects.get(block);if(prepared)return prepared;
  block.querySelectorAll('img[loading="lazy"]').forEach(img=>{img.loading='eager';});
  const video=block.querySelector('video');if(video?.dataset.deferPoster){video.poster=video.dataset.deferPoster;delete video.dataset.deferPoster;}
  const effect=pixelCard(block);prepared={effect,ready:effect.prepare()};effects.set(block,prepared);return prepared;
 }
 async function reveal(block,run){
  if(reduced.matches){block.classList.add('case-revealed');return;}
  const {effect,ready}=prepareBlock(block);await ready;if(run!==generation){block.querySelector('.card-pixels')?.remove();return;}
  effect.set(0);block.classList.add('case-revealed');
  const animation=block.animate([{transform:'translateY(100px)',opacity:.3},{transform:'translateY(0)',opacity:1}],{duration:1100,easing:'cubic-bezier(.16,1,.3,1)'});animations.push(animation);
  const start=performance.now();function tick(now){if(run!==generation)return;const p=Math.min(1,(now-start)/1400);effect.set(p);if(p<1)requestAnimationFrame(tick);else{block.querySelector('.card-pixels')?.remove();effects.delete(block);}}requestAnimationFrame(tick);
 }
 function start(slug){
  reset();active=true;root.hidden=false;root.inert=false;const run=generation;
  let page=root.querySelector(`[data-case="${slug}"]`);
  if(!page){const template=root.querySelector(`template[data-project-template="${slug}"]`);if(template){root.append(template.content.cloneNode(true));page=root.querySelector(`[data-case="${slug}"]`);}}
  if(!page){page=root.querySelector('[data-case="generic"]');const id=Object.keys(PROJECT_SLUGS).find(k=>PROJECT_SLUGS[k]===slug);const card=document.querySelector(`.project-card[data-project="${id}"]`);page.querySelector('.case-cover img').src=(card.querySelector('img').dataset.deferSrc||card.querySelector('img').src);page.querySelector('h1').textContent=card.querySelector('h3').textContent;page.querySelector('.case-intro').textContent=[...card.querySelector('.project-services').childNodes].map(n=>n.textContent.trim()).filter(Boolean).join(', ');page.querySelector('.case-logo p').textContent=card.querySelector('h3').textContent;}
  page.hidden=false;page.querySelectorAll('[data-defer-src]').forEach(img=>{if(img.dataset.deferSrcset){img.srcset=img.dataset.deferSrcset;delete img.dataset.deferSrcset;}img.src=img.dataset.deferSrc;delete img.dataset.deferSrc;});root.scrollTop=0;root.focus({preventScroll:true});document.title=JSON.parse(document.querySelector('#project-metadata')?.textContent||'{}').projects?.[slug]?.title||`${page.querySelector('h1').firstChild.textContent} — garcy.studio`;
  const directLanding=firstStart&&document.documentElement.dataset.project===slug;firstStart=false;
  for(const block of page.querySelector('.case-hero').children){block.dataset.revealed='true';const video=block.querySelector('video');if(video?.dataset.deferPoster){video.poster=video.dataset.deferPoster;delete video.dataset.deferPoster;}if(directLanding)block.classList.add('case-revealed');else reveal(block,run);}
  warmObserver=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){prepareBlock(e.target);warmObserver.unobserve(e.target);}},{root,rootMargin:'75% 0px',threshold:0});
  observer=new IntersectionObserver(entries=>{for(const e of entries){const v=e.target.querySelector('video');if(v){if(e.isIntersecting&&v.dataset.deferPoster){v.poster=v.dataset.deferPoster;delete v.dataset.deferPoster;}if(e.isIntersecting)visibleVideos.add(v);else visibleVideos.delete(v);media();}if(e.isIntersecting&&!e.target.dataset.revealed){e.target.dataset.revealed='true';reveal(e.target,run);}}},{root,threshold:.01});
  page.querySelectorAll('.case-block').forEach(block=>{warmObserver.observe(block);observer.observe(block);});
  if(page.querySelector('.case-cover video'))observer.observe(page.querySelector('.case-cover'));
 }
 function reset(){generation++;active=false;observer?.disconnect();warmObserver?.disconnect();effects=new WeakMap();visibleVideos.clear();animations.forEach(a=>a.cancel());animations=[];media();root.hidden=true;root.inert=true;root.querySelectorAll('.case-page').forEach(p=>p.hidden=true);root.querySelectorAll('.case-block,.case-hero>*').forEach(b=>{delete b.dataset.revealed;b.classList.remove('case-revealed','card-resolving');b.querySelector('.card-pixels')?.remove();});document.title='garcy.studio';}
 root.addEventListener('click',e=>{if(!e.target.closest('.case-back,.case-return')||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();back();});
 root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();back();}});
 document.addEventListener('visibilitychange',media);
 return {start,reset,setPaused(value){paused=value;media();}};
}
