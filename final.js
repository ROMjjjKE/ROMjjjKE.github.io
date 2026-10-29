import {GALLERY_IMAGES} from './gallery-images.js';
import {pixelReveal,wrapWords} from './story.js';
import {pixelCard,draggableStrip} from './card-effects.js';
export function createFinal(reduced){
 const root=document.querySelector('.final-scene'),copy=root.querySelector('.final-copy'),title=root.querySelector('.final-title');
 root.style.setProperty('--grain',getComputedStyle(document.querySelector('.story-viewport')).getPropertyValue('--grain'));
 const track=root.querySelector('.team-track');
 // studio-4 is already represented by the interior photo between Loren and Tom.
 const extras=GALLERY_IMAGES.filter(item=>item.group==='studio-photos'&&item.src!=='/assets/tornado/studio-4.webp');
 extras.forEach(item=>{const card=document.createElement('article');card.className='team-card';const image=new Image();image.dataset.deferSrc=item.src;image.alt='Life at garcy.studio';image.loading='eager';image.decoding='async';image.width=282;image.height=361;card.append(image);track.append(card);});
 const cards=[...root.querySelectorAll('.team-card')],pixels=cards.map(pixelCard);[copy,title].forEach(wrapWords);draggableStrip(root.querySelector('.team-strip'));
 let generation=0,timers=[],cleanups=[],frame,active=false,paused=reduced.matches;
 function reset(){generation++;active=false;timers.forEach(clearTimeout);timers=[];cleanups.forEach(f=>f());cleanups=[];cancelAnimationFrame(frame);root.classList.remove('final-active','final-title-ready','final-joy-ready');root.inert=true;root.setAttribute('aria-hidden','true');cards.forEach(c=>{c.style.transform='';c.style.opacity='0';});}
 function start(){reset();const run=generation;active=true;root.inert=false;root.setAttribute('aria-hidden','false');root.classList.add('final-active');root.querySelectorAll('[data-defer-src]').forEach(img=>{img.loading='eager';img.src=img.dataset.deferSrc;delete img.dataset.deferSrc;});root.focus({preventScroll:true});
 cleanups.push(pixelReveal(copy,{duration:1000,stagger:90,reduced:reduced.matches}));
 const later=(fn,ms)=>timers.push(setTimeout(()=>{if(active)fn();},reduced.matches?0:ms));
 later(()=>{root.classList.add('final-title-ready');cleanups.push(pixelReveal(title,{duration:1800,reduced:reduced.matches}));},1600);
 later(()=>root.classList.add('final-joy-ready'),3500);
 later(async()=>{// Offscreen lazy images must never hold the entire strip invisible.
 const preparation=Promise.allSettled(pixels.map(p=>p.prepare()));
 let deadline;await Promise.race([preparation,new Promise(resolve=>{deadline=setTimeout(resolve,1200);})]);clearTimeout(deadline);if(!active||run!==generation)return;const time=performance.now();function tick(now){if(!active)return;let done=true;cards.forEach((c,i)=>{const p=reduced.matches||paused?1:Math.max(0,Math.min(1,(now-time-Math.min(i,4)*220)/1400));if(p<1)done=false;c.style.opacity=String(Math.min(1,p*5));c.style.transform=`translateX(${(1-p)**3*innerWidth}px)`;pixels[i].set(p);});if(!done)frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);},3900);
 }
 return {start,reset,setPaused(value){paused=value;root.classList.toggle('motion-paused',value);}};
}
