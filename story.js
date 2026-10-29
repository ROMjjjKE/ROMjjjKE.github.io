import {pixelCard} from './card-effects.js';
import { departStory } from './scene-effects.js';
import { testimonialVideo,setupTestimonialLoops } from './testimonial-videos.js';
// Desktop 03–05. Native vertical scrolling drives the staged composition.
const clamp = (n, a=0, b=1) => Math.max(a, Math.min(b,n));
const ease = n => { n=clamp(n); return n*n*(3-2*n); };
const LOGOS = ['o2','ooredoo','skoda','creative-dock','mccann','cnc','cbre','cpi','magu','anect','nachonacho','lmc','linet','seba','sefira'];

// Draw the laid-out words, including italic spans, so the pixel layer follows wrapping.
export function pixelReveal(element, {duration=1600, stagger=0, reduced=false, exclude=null}={}) {
  element.querySelectorAll(':scope > canvas').forEach(c=>c.remove());
  const words=[...element.querySelectorAll('[data-pixel-word]')].filter(word=>!exclude || !word.closest(exclude));
  if(reduced || !words.length) { words.forEach(w=>w.style.opacity=''); return ()=>{}; }
  const rect=element.getBoundingClientRect(), scale=2;
  const source=document.createElement('canvas'), canvas=document.createElement('canvas');
  source.width=canvas.width=Math.ceil(rect.width*scale); source.height=canvas.height=Math.ceil(rect.height*scale);
  const ctx=source.getContext('2d'), out=canvas.getContext('2d');
  if(!ctx || !out || !source.width || !source.height)return ()=>{};
  canvas.className='pixel-overlay'; canvas.setAttribute('aria-hidden','true');
  const lines=[];
  words.forEach(word=>{
    const r=word.getBoundingClientRect(), s=getComputedStyle(word);
    let row=lines.find(l=>Math.abs(l.y-(r.top-rect.top))<4);
    if(!row){row={y:r.top-rect.top,height:r.height,words:[]};lines.push(row);}
    row.words.push(word);
    ctx.font=`${s.fontStyle} ${s.fontWeight} ${parseFloat(s.fontSize)*scale}px ${s.fontFamily}`;
    ctx.letterSpacing=`${parseFloat(s.letterSpacing||0)*scale || 0}px`;
    ctx.fillStyle=s.color; ctx.textBaseline='alphabetic';
    const marker=document.createElement('span');marker.style.cssText='display:inline-block;width:0;height:0;padding:0;margin:0;vertical-align:baseline';word.append(marker);
    const baseline=marker.getBoundingClientRect().top;marker.remove();
    const text=s.textTransform==='uppercase'?word.textContent.toLocaleUpperCase('en'):s.textTransform==='lowercase'?word.textContent.toLocaleLowerCase('en'):word.textContent;
    ctx.fillText(text,(r.left-rect.left)*scale,(baseline-rect.top)*scale);
    word.style.opacity='0';
  });
  lines.sort((a,b)=>a.y-b.y); element.append(canvas);
  const data=ctx.getImageData(0,0,source.width,source.height).data;
  let frame, stopped=false; const start=performance.now();
  function draw(now){
    if(stopped)return; out.clearRect(0,0,canvas.width,canvas.height);
    let done=true;
    lines.forEach((line,i)=>{
      const p=clamp((now-start-i*stagger)/duration);
      if(p===1){line.words.forEach(w=>w.style.opacity='');return;}
      done=false;const step=p<.3?8:p<.65?4:2;
      for(let y=Math.max(0,Math.floor(line.y*scale));y<Math.min(canvas.height,(line.y+line.height)*scale);y+=step){
        for(let x=0;x<canvas.width;x+=step){const offset=(y*canvas.width+x)*4;
          if(data[offset+3] && ((x*17+y*31)%101)/101<p){out.fillStyle=`rgba(${data[offset]},${data[offset+1]},${data[offset+2]},${data[offset+3]/255})`;out.fillRect(x,y,step,step);}
        }
      }
    });
    if(!done)frame=requestAnimationFrame(draw);else canvas.remove();
  }
  frame=requestAnimationFrame(draw);
  return ()=>{stopped=true;cancelAnimationFrame(frame);canvas.remove();words.forEach(w=>w.style.opacity='');};
}
export function wrapWords(root){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); const nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  nodes.forEach(node=>{const fragment=document.createDocumentFragment();node.textContent.split(/(\s+)/).forEach(text=>{if(!text)return;if(/^\s+$/.test(text))fragment.append(document.createTextNode(text));else{const span=document.createElement('span');span.dataset.pixelWord='';span.textContent=text;fragment.append(span);}});node.replaceWith(fragment);});
}
export function createStory(reducedMotion,onSection=()=>{}){
  setupTestimonialLoops();
  const root=document.querySelector('.story'), viewport=root.querySelector('.story-viewport');
  const copy=root.querySelector('.story-copy'), title=root.querySelector('.story-title'), wall=root.querySelector('.logo-wall');
  const slider=root.querySelector('.testimonials'), track=root.querySelector('.testimonial-track');
  const videos=[...root.querySelectorAll('video')];
  const cardElements=[...track.children],cardPixels=cardElements.slice(0,4).map(pixelCard);
  let preparedCards=false;
  [copy,title,...root.querySelectorAll('.testimonial-copy')].forEach(wrapWords);
  const grain=document.createElement('canvas');grain.width=grain.height=128;
  const grainContext=grain.getContext('2d');
  if(grainContext){const noise=grainContext.createImageData(128,128);for(let i=0;i<noise.data.length;i+=4){const value=Math.floor(Math.random()*256);noise.data[i]=noise.data[i+1]=noise.data[i+2]=value;noise.data[i+3]=255;}grainContext.putImageData(noise,0,0);viewport.style.setProperty('--grain',`url("${grain.toDataURL()}")`);}
  const words=[...copy.querySelectorAll('[data-pixel-word]')];
  let active=false,paused=reducedMotion.matches,unreveals=[],headlineShown=false,cardsShown=false,copyScale=1,resizeTimer;
  let progress=0,lastLogoSlot=null,cycleTimer,scrollFrame;
  let departure;
  const logoTransitions=new Set();
  const slots=LOGOS.slice(0,11).map(name=>{const slot=document.createElement('div');slot.className='logo-slot';const img=new Image();img.dataset.deferSrc=`./assets/logos/${name}.svg`;img.alt=name;slot.dataset.logo=name;slot.append(img);wall.append(slot);return slot;});
  let titleTimers=[], cancelTitle=()=>{}, titleHovered=false;
  function clearTitle(){titleTimers.forEach(clearTimeout);titleTimers=[];cancelTitle();}
  function revealTitle(){
    clearTitle();title.classList.remove('space-ready','dont-ready');
    if(reducedMotion.matches || paused){title.classList.add('space-ready','dont-ready');return;}
    cancelTitle=pixelReveal(title,{duration:1900,exclude:'.story-insert'});
    titleTimers.push(setTimeout(()=>{if(active && !titleHovered)title.classList.add('space-ready');},3400));
    titleTimers.push(setTimeout(()=>{if(active && !titleHovered)title.classList.add('dont-ready');},3650));
  }
  title.addEventListener('pointerenter',event=>{if(!active || !headlineShown || event.pointerType!=='mouse')return;titleHovered=true;clearTitle();title.classList.remove('space-ready','dont-ready');});
  title.addEventListener('pointerleave',event=>{if(!titleHovered || event.pointerType!=='mouse')return;titleHovered=false;revealTitle();});
  function fit(){
    copy.style.transform='';copy.style.fontSize='';
    const available=viewport.clientHeight-155;
    if(copy.scrollHeight>available)copy.style.fontSize=`${Math.max(15,parseFloat(getComputedStyle(copy).fontSize)*available/copy.scrollHeight)}px`;
    copyScale=innerWidth<700?.45:Math.min(.59,400/copy.offsetWidth);
    render();
  }
  function media(){videos.forEach(v=>{
    const bounds=v.parentElement.getBoundingClientRect();
    const visible=bounds.right>0 && bounds.left<innerWidth;
    if(active && progress>2.8 && visible && !paused && !document.hidden && !dialog.open){if(v.paused)v.play().catch(()=>{});}else if(!v.paused)v.pause();
  });}
  function render(){
    if(!active)return;
    progress=root.scrollTop/viewport.clientHeight;
    const highlight=clamp(progress/1.2);
    words.forEach((word,i)=>word.style.color=i<Math.max(6,highlight*words.length)?'#eee':'#9d9d9d');
    const shrink=ease((progress-1.25)/.6), testimonials=ease((progress-2.3)/.4);
    copy.style.transform=`translateY(${innerWidth<700?-testimonials*190:0}px) scale(${1-(1-copyScale)*shrink})`;
    copy.style.opacity=String((1-.22*shrink)*(innerWidth<700?1-shrink:1));
    title.style.setProperty('--title-shift',`${-testimonials*viewport.clientHeight*(innerWidth<700?.36:.118)}px`);
    title.style.opacity=String(clamp((progress-1.75)/.2));
    const logoEntrance=ease((progress-2.0)/.3);
    wall.style.transform=`translateY(${(1-logoEntrance)*110-testimonials*viewport.clientHeight*(innerWidth<700?.43:.30)}px)`;
    wall.style.opacity=String(logoEntrance);
    slider.style.transform='none';
    cardElements.forEach((card,i)=>{const p=i<4?clamp((progress-2.8-i*.045)/.40):1;card.style.transform=`translateX(${(1-ease(p))*innerWidth*1.05}px)`;card.style.opacity=String(Math.min(1,p*5));cardPixels[i]?.set(reducedMotion.matches?1:p**1.8);});
    slider.style.opacity=String(clamp((progress-2.78)/.12));
    root.querySelector('.story-continue').classList.toggle('available',progress>=2.8);
    slider.inert=progress<2.8;wall.inert=logoEntrance<.2;
    title.style.visibility=progress>1.7?'visible':'hidden';
    if(progress>1.75 && !headlineShown){headlineShown=true;revealTitle();}
    if(progress>2.0 && !preparedCards){preparedCards=true;Promise.all(cardPixels.map(p=>p.prepare())).then(render);}
    onSection(progress<1.75?'approach':progress<2.8?'clients':'testimonials');
    media();
  }
  root.addEventListener('scroll',()=>{cancelAnimationFrame(scrollFrame);scrollFrame=requestAnimationFrame(render);},{passive:true});
  function scheduleCycle(){clearTimeout(cycleTimer);cycleTimer=setTimeout(()=>{if(!active)return;cycle();scheduleCycle();},innerWidth<700?600+Math.random()*400:950+Math.random()*1100);}
  function cycle(){
    if(!active || paused || document.hidden || progress<2.1 || dialog.open)return;
    const visible=slots.filter(slot=>getComputedStyle(slot).display!=='none');
    const candidates=visible.filter(slot=>slot!==lastLogoSlot);
    const slot=candidates[Math.floor(Math.random()*candidates.length)];lastLogoSlot=slot;
    const replacements=LOGOS.filter(name=>!slots.some(s=>s.dataset.logo===name));
    const name=replacements[Math.floor(Math.random()*replacements.length)];
    const img=new Image();img.src=`./assets/logos/${name}.svg`;img.alt=name;
    img.decode().then(()=>{
      if(!active)return;const previous=slot.firstElementChild;slot.dataset.logo=name;slot.append(img);
      const finish=pixelLogoSwap(slot,previous,img,()=>!active || paused || reducedMotion.matches || document.hidden,()=>logoTransitions.delete(finish));
      logoTransitions.add(finish);
    }).catch(()=>{});
  }
  let dragging=false,startX=0,startScroll=0,lastX=0,velocity=0,dragDistance=0,inertia;
  const maxScroll=()=>slider.scrollWidth-slider.clientWidth;
  slider.addEventListener('pointerdown',event=>{if(event.pointerType==='touch'){dragDistance=0;return;}if(event.button!==0)return;dragging=true;startX=lastX=event.clientX;startScroll=slider.scrollLeft;dragDistance=0;velocity=0;cancelAnimationFrame(inertia);});
  slider.addEventListener('pointermove',event=>{if(!dragging)return;dragDistance=Math.max(dragDistance,Math.abs(event.clientX-startX));if(dragDistance>6){slider.setPointerCapture(event.pointerId);slider.classList.add('dragging');slider.scrollLeft=startScroll-(event.clientX-startX);velocity=lastX-event.clientX;}lastX=event.clientX;});
  function release(){if(!dragging)return;dragging=false;slider.classList.remove('dragging');let previous=performance.now();function tick(now){const dt=Math.min(32,now-previous)/16.67;previous=now;slider.scrollLeft=clamp(slider.scrollLeft+velocity*dt,0,maxScroll());velocity*=Math.pow(.92,dt);if(Math.abs(velocity)>.2 && !paused)inertia=requestAnimationFrame(tick);}inertia=requestAnimationFrame(tick);}
  slider.addEventListener('pointerup',release);slider.addEventListener('pointercancel',release);slider.addEventListener('lostpointercapture',release);
  slider.addEventListener('click',e=>{if(dragDistance>6 && e.detail!==0){e.preventDefault();e.stopImmediatePropagation();}},{capture:true});
  slider.addEventListener('scroll',()=>{const center=slider.getBoundingClientRect().left+slider.clientWidth/2;videos.forEach(v=>{const r=v.parentElement.getBoundingClientRect();v.style.transform=`translateX(${clamp((center-r.left-r.width/2)*.07,-22,22)}px) scale(1.15)`;});media();},{passive:true});
  slider.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();slider.scrollBy({left:(e.key==='ArrowLeft'?-1:1)*336,behavior:reducedMotion.matches?'instant':'smooth'});}});
  root.querySelectorAll('.video-play').forEach(button=>setupPixelPlay(button,reducedMotion));
  const dialog=document.querySelector('.video-dialog'), frame=dialog.querySelector('.testimonial-player'), music=document.querySelector('.music-track'), podcast=document.querySelector('.podcast-track');let restoreMusic=false,restorePodcast=false,trigger;
  root.querySelectorAll('[data-testimonial]').forEach(button=>button.addEventListener('click',()=>{
    trigger=button;restoreMusic=!music.paused;restorePodcast=!podcast.paused;music.pause();podcast.pause();
    frame.title=`${button.dataset.person} — testimonial`;
    frame.src=testimonialVideo(button.dataset.testimonial);
    dialog.showModal();frame.play().catch(()=>{});media();
  }));
  dialog.querySelector('.video-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  dialog.addEventListener('close',()=>{frame.pause();frame.removeAttribute('src');frame.load();if(restoreMusic)music.play().catch(()=>{});if(restorePodcast)podcast.play().catch(()=>{});restoreMusic=restorePodcast=false;media();trigger?.focus({preventScroll:true});});
  function start(at=0){wall.querySelectorAll('[data-defer-src]').forEach(img=>{img.src=img.dataset.deferSrc;delete img.dataset.deferSrc;});active=true;root.inert=false;root.setAttribute('aria-hidden','false');root.classList.add('story-active');root.scrollTop=at*viewport.clientHeight;fit();root.focus({preventScroll:true});if(at<1.75)unreveals.push(pixelReveal(copy,{duration:800,stagger:95,reduced:reducedMotion.matches}));scheduleCycle();}
  function reset(){departure?.cancel();departure=null;clearTitle();titleHovered=false;title.classList.remove('space-ready','dont-ready');active=false;root.inert=true;root.setAttribute('aria-hidden','true');root.classList.remove('story-active');root.scrollTop=0;headlineShown=cardsShown=false;preparedCards=false;unreveals.forEach(fn=>fn());unreveals=[];clearTimeout(cycleTimer);logoTransitions.forEach(finish=>finish());logoTransitions.clear();lastLogoSlot=null;cancelAnimationFrame(inertia);if(dialog.open)dialog.close();media();}
  window.addEventListener('resize',()=>{if(!active)return;clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{unreveals.forEach(fn=>fn());clearTitle();if(headlineShown)title.classList.add('space-ready','dont-ready');fit();},120);});
  document.addEventListener('visibilitychange',media);
  function atEnd(){return active && progress>=3.335-3/viewport.clientHeight;}
  async function leave(){
    active=false;root.inert=true;clearTimeout(cycleTimer);clearTitle();
    logoTransitions.forEach(finish=>finish());logoTransitions.clear();
    unreveals.forEach(fn=>fn());cancelAnimationFrame(inertia);media();
    departure=departStory(viewport,[copy,title,wall],cardElements,reducedMotion.matches || paused);
    await departure.done;
    root.classList.remove('story-active');root.setAttribute('aria-hidden','true');
  }
  function resumeTestimonials(){
    departure?.cancel();departure=null;active=true;
    root.inert=false;root.setAttribute('aria-hidden','false');root.classList.add('story-active');
    root.scrollTop=root.scrollHeight-root.clientHeight;headlineShown=cardsShown=true;
    title.classList.add('space-ready','dont-ready');fit();render();media();scheduleCycle();root.focus({preventScroll:true});
  }
  return {start,reset,atEnd,leave,resumeTestimonials,setPaused(value){paused=value;if(value){logoTransitions.forEach(finish=>finish());logoTransitions.clear();unreveals.forEach(fn=>fn());clearTitle();if(headlineShown)title.classList.add('space-ready','dont-ready');}media();}};
}

// The exact Figma export supplies both the button shape and play glyph.
export function setupPixelPlay(button,reducedMotion){
  const image=button.querySelector('.play-square img'),canvas=button.querySelector('.play-pixels');
  const context=canvas.getContext('2d'),source=document.createElement('canvas');source.width=source.height=90;
  const sourceContext=source.getContext('2d');let pixels,frame,amount=0,target=0,hovered=false,focused=false;
  const ready=image.decode().then(()=>{sourceContext.drawImage(image,0,0,90,90);pixels=sourceContext.getImageData(0,0,90,90).data;}).catch(()=>{});
  function draw(value,coarse){
    if(!pixels || !context)return;
    context.clearRect(0,0,90,90);
    const size=coarse;
    for(let y=0;y<90;y+=size)for(let x=0;x<90;x+=size){
      const i=(Math.min(89,y+Math.floor(size/2))*90+Math.min(89,x+Math.floor(size/2)))*4;
      const brightness=pixels[i]/255;
      context.fillStyle=`rgba(${pixels[i]},${pixels[i+1]},${pixels[i+2]*(1-value)+brightness*64*value},${pixels[i+3]/255})`;
      context.fillRect(x,y,size,size);
    }
  }
  async function update(){
    target=hovered || focused?1:0;await ready;if(!pixels)return;
    cancelAnimationFrame(frame);button.classList.add('pixel-hover');
    const from=amount,start=performance.now(),destination=target;
    function tick(now){
      const p=reducedMotion.matches?1:clamp((now-start)/650),eased=1-Math.pow(1-p,3);
      amount=from+(destination-from)*eased;
      const block=p===1?1:Math.max(2,Math.round(Math.sin(p*Math.PI)*7));
      draw(amount,block);
      if(p<1)frame=requestAnimationFrame(tick);else if(destination===0)button.classList.remove('pixel-hover');
    }
    frame=requestAnimationFrame(tick);
  }
  button.addEventListener('pointerenter',()=>{hovered=true;update();});
  button.addEventListener('pointerleave',()=>{hovered=false;update();});
  button.addEventListener('focus',()=>{focused=button.matches(':focus-visible');update();});
  button.addEventListener('blur',()=>{focused=false;update();});
}

// Pixelate the supplied logo vectors while preserving the vertical swap motion.
export function pixelLogoSwap(slot,previous,next,shouldStop,onFinish){
  const canvas=document.createElement('canvas'),buffer=document.createElement('canvas'),small=document.createElement('canvas');
  const width=slot.clientWidth,height=slot.clientHeight,ratio=2;
  canvas.width=buffer.width=Math.ceil(width*ratio);canvas.height=buffer.height=Math.ceil(height*ratio);
  canvas.className='logo-pixels';canvas.setAttribute('aria-hidden','true');
  const context=canvas.getContext('2d'),paint=buffer.getContext('2d'),sample=small.getContext('2d');
  let frame,finished=false;
  const finish=()=>{if(finished)return;finished=true;cancelAnimationFrame(frame);previous.remove();next.style.opacity='';canvas.remove();onFinish();};
  if(!context || !paint || !sample || !width){requestAnimationFrame(finish);return finish;}
  const slotRect=slot.getBoundingClientRect();
  const bounds=image=>{const r=image.getBoundingClientRect();return{x:(r.left-slotRect.left)*ratio,y:(r.top-slotRect.top)*ratio,width:r.width*ratio,height:r.height*ratio};};
  const oldBox=bounds(previous),newBox=bounds(next);
  previous.style.opacity=next.style.opacity='0';slot.append(canvas);
  const started=performance.now();
  function tick(now){
    if(finished)return;
    const p=clamp((now-started)/1000);
    if(p===1 || shouldStop()){finish();return;}
    const movement=ease(p),block=Math.max(1,Math.round(Math.sin(p*Math.PI)*8));
    paint.clearRect(0,0,buffer.width,buffer.height);
    paint.drawImage(previous,oldBox.x,oldBox.y-movement*height*ratio,oldBox.width,oldBox.height);
    paint.drawImage(next,newBox.x,newBox.y+(1-movement)*height*ratio,newBox.width,newBox.height);
    small.width=Math.max(1,Math.ceil(buffer.width/block));small.height=Math.max(1,Math.ceil(buffer.height/block));
    sample.drawImage(buffer,0,0,small.width,small.height);
    context.clearRect(0,0,canvas.width,canvas.height);context.imageSmoothingEnabled=false;
    context.drawImage(small,0,0,canvas.width,canvas.height);
    frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);return finish;
}
