import {testimonialVideo,setupTestimonialLoops} from './testimonial-videos.js';
import {setupPixelPlay,pixelLogoSwap} from './story.js';
import {setupStudioMenu} from './studio-menu.js';
import {setupButtonPixels} from './button-effects.js';
import {pixelCard,draggableStrip} from './card-effects.js';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
if(!reduced.matches)document.documentElement.classList.add('service-motion');
setupStudioMenu({onToggle:open=>{document.documentElement.style.overflow=open?'hidden':'';}});

setupButtonPixels(reduced);
document.querySelectorAll('.video-play').forEach(b=>setupPixelPlay(b,reduced));
for(const strip of document.querySelectorAll('.service-projects,.service-testimonials'))draggableStrip(strip);
// Prepare only visible content; resolve with the same timing as project blocks.
const observer=new IntersectionObserver(entries=>{for(const entry of entries){
 if(!entry.isIntersecting)continue;observer.unobserve(entry.target);
 if(reduced.matches){entry.target.classList.add('service-ready');continue;}
 const fx=pixelCard(entry.target);
 fx.prepare().then(()=>{
  fx.set(0);entry.target.classList.add('service-ready');
  entry.target.animate([{transform:'translateY(100px)',opacity:.3},{transform:'translateY(0)',opacity:1}],{duration:1100,easing:'cubic-bezier(.16,1,.3,1)'});
  const start=performance.now();function tick(now){const p=Math.min(1,(now-start)/1400);fx.set(p);if(p<1)requestAnimationFrame(tick);else entry.target.querySelector('.card-pixels')?.remove();}requestAnimationFrame(tick);
 });
}},{threshold:.12});
document.fonts.ready.then(()=>document.querySelectorAll('.service-reveal').forEach(el=>observer.observe(el)));
const logoNames=['o2','ooredoo','skoda','creative-dock','mccann','cnc','cbre','cpi','magu','anect','nachonacho','lmc','linet','seba','sefira'];
const slots=[...document.querySelectorAll('.service-logos .logo-slot')];let lastSlot;
function cycle(){setTimeout(async()=>{
 const wall=document.querySelector('.service-logos').getBoundingClientRect();
 if(!reduced.matches&&!document.hidden&&wall.bottom>0&&wall.top<innerHeight){
  const visible=slots.filter(s=>s!==lastSlot&&getComputedStyle(s).display!=='none');
  const slot=visible[Math.floor(Math.random()*visible.length)];
  const names=logoNames.filter(n=>!slots.some(s=>s.dataset.logo===n));
  if(slot&&names.length){const name=names[Math.floor(Math.random()*names.length)],img=new Image();img.src='/assets/logos/'+name+'.svg';img.alt=name;
   try{await img.decode();lastSlot=slot;slot.dataset.logo=name;const previous=slot.firstElementChild;slot.append(img);pixelLogoSwap(slot,previous,img,()=>reduced.matches||document.hidden,()=>{});}catch{}
  }
 }
 cycle();
},1200+Math.random()*1000);}cycle();
// Pointer velocity gives the image a short inertial nudge, then a damped return.
for(const card of document.querySelectorAll('.service-project')){
 const img=card.querySelector('img');let x=0,y=0,vx=0,vy=0,lastX=0,lastY=0,frame=0,previous=0;
 function tick(now){const dt=Math.min(2,(now-(previous||now))/16.67)||1;previous=now;
  vx=(vx-x*.035*dt)*Math.pow(.84,dt);vy=(vy-y*.035*dt)*Math.pow(.84,dt);x+=vx*dt;y+=vy*dt;
  card.style.translate=`${x}px ${y}px`;card.style.rotate=`${x*.12}deg`;img.style.transform='scale(1.04)';
  if(Math.abs(x)+Math.abs(y)+Math.abs(vx)+Math.abs(vy)>.05)frame=requestAnimationFrame(tick);else{frame=0;previous=0;img.style.transform='';card.style.translate='';card.style.rotate='';}
 }
 card.addEventListener('pointerenter',e=>{lastX=e.clientX;lastY=e.clientY;});
 card.addEventListener('pointermove',e=>{if(reduced.matches||e.pointerType==='touch'||e.buttons)return;
  vx+=Math.max(-5,Math.min(5,(e.clientX-lastX)*.12));vy+=Math.max(-5,Math.min(5,(e.clientY-lastY)*.12));lastX=e.clientX;lastY=e.clientY;
  if(!frame)frame=requestAnimationFrame(tick);
 });
}
setupTestimonialLoops();
const loops=[...document.querySelectorAll('.video-testimonial video')];const videos=new IntersectionObserver(entries=>{for(const {target,isIntersecting} of entries){if(isIntersecting&&!reduced.matches)target.play().catch(()=>{});else target.pause();}},{threshold:.2});loops.forEach(v=>videos.observe(v));
const dialog=document.querySelector('.video-dialog'),player=dialog.querySelector('video');let trigger;
for(const button of document.querySelectorAll('[data-testimonial]'))button.addEventListener('click',()=>{trigger=button;loops.forEach(v=>v.pause());player.src=testimonialVideo(button.dataset.testimonial);player.setAttribute('aria-label',button.dataset.person+' testimonial');document.documentElement.style.overflow='hidden';dialog.showModal();player.play().catch(()=>{});});
const close=()=>dialog.close();dialog.querySelector('.video-close').addEventListener('click',close);dialog.addEventListener('close',()=>{document.documentElement.style.overflow='';player.pause();player.removeAttribute('src');player.load();trigger?.focus();loops.forEach(v=>{const r=v.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight&&!reduced.matches)v.play().catch(()=>{});});});
