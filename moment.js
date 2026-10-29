import { GALLERY_IMAGES } from './gallery-images.js';

export function createMomentScene(scene, reducedMotion) {
  const gallery = scene.querySelector('.tornado-cards');
  const pixels = scene.querySelector('.headline-pixels');
  const headline = scene.querySelector('.moment-title');
  const continueButton = scene.querySelector('.moment-continue');
  let formed = false, headlineComplete = false;
  const canContinue = () => active && (formed || (headlineComplete && flightTime >= 3500));
  function updateReady() {
    if (canContinue()) formed = true;
    continueButton.disabled = !formed;
  }
  let headlineHovered = false;
  let headlineRun = 0;
  let active = false;
  let paused = reducedMotion.matches;
  let frame;
  let angle = 0;
  let yaw = 0, targetYaw = 0, tilt = 0, targetTilt = 0, pan = 0, targetPan = 0;
  let velocity = 0;
  let flightTime = 0;
  let dragging = false;
  let pointer = null;
  let lastPointerX = 0, lastPointerY = 0;
  const clamp = (v,min,max) => Math.min(max,Math.max(min,v));
  const mix = (a,b,t) => a+(b-a)*t;
  const smooth = t => t*t*(3-2*t);
  let last = 0;
  let run = 0;
  let preparePromise;
  let revealAnimation;
  let items = [];
  const shuffle = values => {
    const result = [...values];
    for (let i=result.length-1;i>0;i--) {
      const j=Math.floor(Math.random()*(i+1));
      [result[i],result[j]]=[result[j],result[i]];
    }
    return result;
  };
  function prepare(fresh=false) {
    if(fresh){gallery.replaceChildren();preparePromise=null;items=[];}
    if (preparePromise) return preparePromise;
    const products=shuffle(GALLERY_IMAGES);
    items=products.map((asset,i) => {
      const card=document.createElement('div');
      card.className='tornado-card';
      const image=new Image();
      image.alt='';
      image.decoding='async';
      image.width=asset.width;
      image.height=asset.height;
      image.src=asset.src;
      image.addEventListener('error',()=>{ card.style.visibility='hidden'; });
      card.append(image);
      gallery.append(card);
      return {card,image,index:i, scatter:(Math.random()-.5), spin:(Math.random()-.5)*110};
    });
    preparePromise=Promise.allSettled([
      ...items.map(({image})=>image.decode()),
      document.fonts.load('600 25px "Restart Soft"'),
      document.fonts.load('600 25px "Perfectly Nineties"'),
    ]);
    position();
    return preparePromise;
  }
  function position() {
    const width=scene.clientWidth, height=scene.clientHeight;
    const narrow=width<600;
    // Occupy most of the viewport, leaving space around the outermost cards.
    const radius=Math.min(width*.38,620);
    const step=narrow?48:65;
    const cardWidth=narrow?clamp(width*.29,106,150):clamp(width*.15,145,195);
    gallery.style.transform=`translate3d(0,${pan}px,0) rotateX(${tilt}deg)`;
    items.forEach(({card,index,scatter,spin})=>{
      const a=index*(narrow?52:30)+angle+yaw;
      const radians=a*Math.PI/180;
      const depth=Math.cos(radians);
      const targetY=(index-(items.length-1)/2)*step;
      const time=flightTime-index*38;
      const rise=reducedMotion.matches?1:clamp(time/1400,0,1);
      const assemble=reducedMotion.matches?1:smooth(clamp((time-950)/1900,0,1));
      const lift=1-Math.pow(1-rise,3);
      const cloudX=scatter*width*.85;
      const cloudY=(index-(items.length-1)/2)*27;
      const x=mix(cloudX,Math.sin(radians)*radius,assemble);
      const y=mix(height*.85+index*12, mix(cloudY,targetY,assemble),lift);
      const z=mix(-220,depth*radius,assemble);
      card.style.width=`${cardWidth}px`;
      card.style.height=`${cardWidth*1.32}px`;
      card.style.opacity=String(clamp(rise*3,0,1));
      card.style.transform=`translate(-50%,-50%) translate3d(${x}px,${y}px,${z}px) rotateY(${a*assemble}deg) rotateZ(${spin*(1-assemble)}deg)`;
      card.style.filter=`brightness(${.4+(depth+1)*.22}) blur(${Math.max(0,-depth)*1.2*assemble}px)`;
    });
  }
  function tick(now) {
    if (!active || document.hidden) return;
    const delta=Math.min(now-last,50);
    last=now;
    flightTime+=delta;
    if(!paused && !dragging) angle+=delta*.006;
    if(!dragging && !paused) { targetYaw+=velocity*delta/16.67; velocity*=Math.pow(.94,delta/16.67); }
    const ease=1-Math.exp(-delta/100);
    yaw=mix(yaw,targetYaw,ease);
    tilt=mix(tilt,targetTilt,ease);
    pan=mix(pan,targetPan,ease);
    position();
    updateReady();
    if(!paused || flightTime<3600 || dragging || Math.abs(targetYaw-yaw)>.02 || Math.abs(targetPan-pan)>.1 || Math.abs(targetTilt-tilt)>.02) frame=requestAnimationFrame(tick);
  }
  function wake() {
    cancelAnimationFrame(frame);
    if(active && !document.hidden) { last=performance.now(); frame=requestAnimationFrame(tick); }
  }
  scene.addEventListener('pointerdown',event=>{
    if(!active || event.button!==0 || event.target.closest('button')) return;
    dragging=true; pointer=event.pointerId; velocity=0;
    lastPointerX=event.clientX; lastPointerY=event.clientY;
    scene.setPointerCapture(pointer);
    scene.classList.add('explored','dragging');
    wake();
  });
  scene.addEventListener('pointermove',event=>{
    if(!dragging || event.pointerId!==pointer) return;
    const dx=event.clientX-lastPointerX, dy=event.clientY-lastPointerY;
    targetYaw+=dx*.24;
    velocity=clamp(dx*.18,-4,4);
    targetTilt=clamp(targetTilt-dy*.06,-16,16);
    targetPan=clamp(targetPan+dy*.65,-scene.clientHeight*.3,scene.clientHeight*.3);
    lastPointerX=event.clientX; lastPointerY=event.clientY;
  });
  const release=()=>{dragging=false;pointer=null;scene.classList.remove('dragging');};
  scene.addEventListener('pointerup',release);
  scene.addEventListener('pointercancel',release);
  scene.addEventListener('lostpointercapture',release);
  scene.addEventListener('wheel',event=>{
    if(!active || event.ctrlKey || Math.abs(event.deltaY)>Math.abs(event.deltaX)) return;
    event.preventDefault(); event.stopPropagation();
    targetYaw+=(event.deltaX+event.deltaY)*.1;
    scene.classList.add('explored'); wake();
  },{passive:false});
  scene.addEventListener('keydown',event=>{
    if(!active || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;
    event.preventDefault();
    if(event.key==='ArrowLeft')targetYaw-=24;
    if(event.key==='ArrowRight')targetYaw+=24;
    if(event.key==='ArrowUp')targetPan=clamp(targetPan+70,-scene.clientHeight*.3,scene.clientHeight*.3);
    if(event.key==='ArrowDown')targetPan=clamp(targetPan-70,-scene.clientHeight*.3,scene.clientHeight*.3);
    if(event.key==='Home'){targetYaw=0;targetTilt=0;targetPan=0;velocity=0;}
    scene.classList.add('explored');wake();
  });
  function revealHeadline() {
    const revealId=++headlineRun;
    cancelAnimationFrame(revealAnimation);
    scene.classList.remove('text-ready','for-ready');
    if(headlineHovered) { scene.classList.add('text-ready'); return; }
    if (reducedMotion.matches) { scene.classList.add('text-ready','for-ready'); headlineComplete=true; updateReady(); return; }
    const ctx=pixels.getContext('2d');
    const buffer=document.createElement('canvas');
    buffer.width=460; buffer.height=108;
    const b=buffer.getContext('2d');
    if (!ctx || !b) { scene.classList.add('text-ready','for-ready'); headlineComplete=true; updateReady(); return; }
    b.fillStyle='#e7e7e7'; b.textBaseline='alphabetic';
    const box=headline.getBoundingClientRect();
    headline.querySelectorAll('.moment-words>span:first-child,.moment-line>span').forEach(line=>{
      const rect=line.getBoundingClientRect(),style=getComputedStyle(line);
      b.font=`${style.fontWeight} ${parseFloat(style.fontSize)*2}px ${style.fontFamily}`;
      b.letterSpacing=`${parseFloat(style.letterSpacing)*2}px`;
      const marker=document.createElement('span');marker.style.cssText='display:inline-block;width:0;height:0;vertical-align:baseline';line.append(marker);
      const baseline=marker.getBoundingClientRect().top;marker.remove();
      const text=line.textContent.toUpperCase(),width=b.measureText(text).width;
      b.fillText(text,(rect.left-box.left)*2+(rect.width*2-width)/2,(baseline-box.top)*2);
    });
    const source=b.getImageData(0,0,460,108).data;
    pixels.width=460; pixels.height=108;
    const started=performance.now(), currentRun=run;
    function draw(now) {
      if (!active || currentRun!==run || revealId!==headlineRun) return;
      const p=Math.min(1,(now-started)/1900);
      ctx.clearRect(0,0,460,108);
      const size=p<.3?8:p<.65?4:2;
      for(let y=0;y<108;y+=size) for(let x=0;x<460;x+=size) {
        const alpha=source[(y*460+x)*4+3];
        const noise=((x*17+y*31)%101)/101;
        if(alpha && noise<p) { ctx.fillStyle=`rgba(231,231,231,${alpha/255})`; ctx.fillRect(x,y,size,size); }
      }
      if(p<1) revealAnimation=requestAnimationFrame(draw);
      else {
        scene.classList.add('text-ready');
        // Hold the completed words for 1.5 seconds before the italic word enters.
        setTimeout(()=>{if(active && currentRun===run && revealId===headlineRun && !headlineHovered) { scene.classList.add('for-ready'); setTimeout(()=>{if(active && currentRun===run && revealId===headlineRun){headlineComplete=true;updateReady();}},850); }},1500);
      }
    }
    revealAnimation=requestAnimationFrame(draw);
  }
  headline.addEventListener('pointerenter',event=>{
    if(!active || !formed || event.pointerType!=='mouse')return;
    headlineHovered=true; headlineRun++;
    cancelAnimationFrame(revealAnimation);
    scene.classList.add('text-ready');
    scene.classList.remove('for-ready');
  });
  headline.addEventListener('pointerleave',event=>{
    if(!active || event.pointerType!=='mouse' || !headlineHovered)return;
    headlineHovered=false;
    revealHeadline();
  });
  async function start() {
    active=true; formed=false; headlineComplete=false; continueButton.disabled=true;
    const currentRun=++run;
    await Promise.race([prepare(true),new Promise(resolve=>setTimeout(resolve,2000))]);
    if(!active || currentRun!==run) return;
    scene.classList.add('moment-active');
    flightTime=reducedMotion.matches?3600:0;
    last=performance.now();
    position();
    frame=requestAnimationFrame(tick);
    setTimeout(()=>{if(active && currentRun===run) revealHeadline();},reducedMotion.matches?0:1300);
  }
  function reset() {
    active=false; formed=false; headlineComplete=false; continueButton.disabled=true; run++; headlineRun++; headlineHovered=false;
    dragging=false; velocity=0; flightTime=0;
    yaw=targetYaw=tilt=targetTilt=pan=targetPan=0;
    cancelAnimationFrame(frame); cancelAnimationFrame(revealAnimation);
    scene.classList.remove('moment-leaving');
    items.forEach(({card})=>card.getAnimations().forEach(a=>a.cancel()));
    scene.classList.remove('moment-active','text-ready','for-ready','explored','dragging');
    const ctx=pixels.getContext('2d');
    ctx?.clearRect(0,0,pixels.width,pixels.height);
  }
  function setPaused(value) {
    paused=value;
    cancelAnimationFrame(frame);
    last=performance.now();
    if(active && !document.hidden) frame=requestAnimationFrame(tick);
  }
  document.addEventListener('visibilitychange',()=>setPaused(paused));
  window.addEventListener('resize',()=>{if(active)position();});
  async function leave() {
    active=false;run++;headlineRun++;
    cancelAnimationFrame(frame);cancelAnimationFrame(revealAnimation);
    await Promise.all(items.map(({card,index,scatter,spin})=>{
      const from=card.style.transform;
      const animation=card.animate(reducedMotion.matches?[{opacity:1},{opacity:0}]:[
        {transform:from,opacity:1},
        {transform:`${from} translate3d(${scatter*180}px,40px,0) rotateZ(${spin*.1}deg)`,opacity:1,offset:.15},
        {transform:`${from} translate3d(${scatter*1800}px,${-scene.clientHeight*3}px,0) rotateZ(${spin*3}deg)`,opacity:0},
      ],{duration:reducedMotion.matches?180:1500,delay:reducedMotion.matches?0:index*22,easing:'cubic-bezier(.55,0,.8,.4)',fill:'forwards'});
      return animation.finished.catch(()=>{});
    }));
  }
  function resume() {
    reset();
    prepare(true);
    active=true; formed=headlineComplete=true; flightTime=3600;
    scene.classList.add('moment-active','text-ready','for-ready');
    position(); updateReady(); wake();
  }
  return {prepare,start,reset,setPaused,leave,resume,canContinue};
}

export function createMusicPlayer() {
  const audio=document.querySelector('.music-track');
  const button=document.querySelector('.music-toggle');
  const icon=button.querySelector('img');
  const podcast=document.querySelector('.podcast-track');
  const podcastButton=document.querySelector('.podcast-toggle');
  function syncPodcast() {
    const playing=!podcast.paused && !podcast.ended;
    podcastButton.setAttribute('aria-label',playing?'Pause garcy.studio podcast':'Play garcy.studio podcast');
    podcastButton.setAttribute('aria-pressed',String(playing));
    podcastButton.querySelector('img').src=playing?'./assets/controls/pause.svg':'./assets/controls/play.svg';
    podcastButton.classList.toggle('playing',playing);
  }
  podcastButton.addEventListener('click',async()=>{
    if(!podcast.paused){podcast.pause();return;}
    audio.pause();
    try { await podcast.play(); } catch { /* Keep the play control available for retry. */ }
    syncPodcast();
  });
  podcast.addEventListener('play',()=>{audio.pause();syncPodcast();});
  podcast.addEventListener('pause',syncPodcast);
  podcast.addEventListener('ended',syncPodcast);
  podcast.addEventListener('error',()=>podcastButton.setAttribute('aria-label','Podcast could not load. Try again'));
  audio.addEventListener('play',()=>podcast.pause());
  syncPodcast();
  audio.volume=.24;
  function sync() {
    const playing=!audio.paused;
    button.setAttribute('aria-label',playing?'Pause Starfall by Ryan Taubert':'Play Starfall by Ryan Taubert');
    button.setAttribute('aria-pressed',String(playing));
    icon.src=playing?'./assets/controls/pause.svg':'./assets/controls/play.svg';
    button.classList.toggle('playing',playing);
  }
  async function play() {
    try { await audio.play(); } catch { /* Play control remains available if playback is blocked. */ }
    sync();
  }
  button.addEventListener('click',()=>audio.paused?play():audio.pause());
  audio.addEventListener('play',sync); audio.addEventListener('pause',sync);
  audio.addEventListener('error',()=>{button.setAttribute('aria-label','Music could not load. Try again');});
  sync();
  return {play,pause:()=>audio.pause()};
}
