import {setupStudioMenu} from './studio-menu.js';
import {SITE,routeMeta} from './site-content.js';
import {track} from './measurement.js';
import {createProjectPages,PROJECT_SLUGS} from './project-pages.js';
import {readRoute} from './routes.js';
import {createFinal} from './final.js';
import {setupButtonPixels,setupArrowReveals} from './button-effects.js';
import { createDome } from './dome.js';
import { prepareEntry, setupSpotlight } from './atmosphere.js';
import { createStory } from './story.js';
import { createMomentScene, createMusicPlayer } from './moment.js';
// Opening-scene timing and content are intentionally editable in one place.
const MESSAGES = [
  { sender: 'Familiar Stranger', text: 'Hey, who made your brand?' },
  { sender: 'The one who left you on read', text: 'Your site is incredible. What studio is that?' },
  { sender: 'Your old boss', text: 'GPT recommended your site, how did you do that?' },
  { sender: 'The one who said no', text: 'Someone just sent me your brand.' },
];
const TIMING = { firstMessage: 1000, betweenMessages: 1900, settle: 600, arrival: 560, videoFade: 1400, dropStagger: 100, dropDuration: 1000 };
const PORTRAITS = Array.from({length:16},(_,i)=>({position:`${(i%4)*100/3}% ${Math.floor(i/4)*100/3}%`}));
// Keep decoded image elements alive from boot and insert those same elements.
const portraitImages = PORTRAITS.map((face, i) => {
  const image = new Image();
  image.alt = ''; image.width = 192; image.height = 192;
  image.fetchPriority = 'high'; image.loading = 'eager';
  image.src = `/assets/portraits/message-${i+1}.webp`;
  face.image = image;
  return image;
});
const portraitsReady = Promise.allSettled(portraitImages.map(image => image.decode()));
let scenePortraits = [];
function choosePortraits() {
  // Each supplied row is a complete, balanced set. Shuffle within that row only.
  const row = Math.floor(Math.random()*4);
  const faces = PORTRAITS.slice(row*4,row*4+4);
  for (let i=faces.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1));
    [faces[i],faces[j]]=[faces[j],faces[i]];
  }
  return faces.slice(0,MESSAGES.length);
}
document.documentElement.classList.add('experience-ready');
document.documentElement.classList.remove('experience-booting');
const pageMetadata=JSON.parse(document.querySelector('#project-metadata')?.textContent||'{}');
const stage = document.querySelector('.stage');
const opening = document.querySelector('.opening');
const nextScene = document.querySelector('.next-scene');
const stack = document.querySelector('.notifications');
const list = document.querySelector('.notification-list');
const video = document.querySelector('.reel');
const videoReveal = document.querySelector('.video-reveal');
const live = document.querySelector('.announcements');
const motionButton = document.querySelector('.motion-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const moment = createMomentScene(nextScene, reducedMotion);
const music = createMusicPlayer();
const story = createStory(reducedMotion,route=>{if(phase==='story')updateRoute(route);});
const dome = createDome(reducedMotion,openProject);
const casePages=createProjectPages(reducedMotion,closeProject);
const finale=createFinal(reducedMotion);
let menuOpen=false;
const studioMenu=setupStudioMenu({onNavigate:menuNavigate,onToggle(open){menuOpen=open;syncMotion();}});
setupButtonPixels(reducedMotion);
setupArrowReveals(reducedMotion);
let cards = [];
let phase = 'loading';
let expanded = false;
let pinnedOpen = false;
let soundEnabled = true;
let audioContext;
let soundBuffer;
let soundDecode;
let soundBytes;
const loadSound = () => soundBytes ??= fetch('./assets/audio/new-notification-051.mp3')
  .then(response => { if (!response.ok) throw new Error('Notification sound could not load'); return response.arrayBuffer(); })
  .catch(error => { console.warn(error.message); return null; });
async function prepareSound() {
  if (!audioContext) return;
  soundDecode ??= loadSound().then(bytes => bytes ? audioContext.decodeAudioData(bytes.slice(0)) : null).catch(() => null);
  soundBuffer = await soundDecode;
}
let paused = reducedMotion.matches;
let generation = 0;
let animations = [];
let lastWheelAt = 0;
let wheelDistance = 0;
let storyWheelDistance = 0, storyWheelAt = 0, storyWheelArmed = false;
const storyRoot = document.querySelector(".story");
let backWheelAt=0, backWheelDistance=0;
let projectsWheelAt=0,projectsWheelDistance=0,projectsWheelArmed=false;
let storyTouchAtEnd=false;
let wheelArmed = false;
let touchStartY = null;
let tickAt = 0;
let elapsed = 0;
let deliveryFrame;

const setPhase = value => { phase = value; stage.dataset.phase = value; const route={arriving:'opening',next:'moment',story:'approach',projects:'projects',final:'studio'}[value];if(route)updateRoute(route); };
function updateRoute(route,push=false){
 const meta=routeMeta(route,pageMetadata.projects),url=route.startsWith('project/')?meta.path:`/#/${route}`;
 if(location.pathname+location.hash!==url)history[push?'pushState':'replaceState'](null,'',url);
 document.title=meta.title;
 document.querySelector('meta[name="description"]')?.setAttribute('content',meta.description);
 document.querySelector('link[rel="canonical"]')?.setAttribute('href',SITE.origin+meta.path);
 for(const [key,value] of [['og:title',meta.title],['og:description',meta.description],['og:url',SITE.origin+meta.path]])document.querySelector(`meta[property="${key}"]`)?.setAttribute('content',value);
 for(const [key,value] of [['og:image',(pageMetadata.socialOrigin||location.origin)+'/'+(meta.image||'assets/social/studio-desktop.jpg')],['twitter:title',meta.title],['twitter:description',meta.description],['twitter:image',(pageMetadata.socialOrigin||location.origin)+'/'+(meta.image||'assets/social/studio-desktop.jpg')]])document.querySelector(`meta[property="${key}"],meta[name="${key}"]`)?.setAttribute('content',value);
 document.querySelector('meta[name="robots"]')?.setAttribute('content',(route.startsWith('project/')?meta.indexable:pageMetadata.indexable)?'index, follow, max-image-preview:large':'noindex, follow');
 track('page_view',{page:route.startsWith('project/')?meta.path:'/',section:route});
}

async function unlockAudio() {
  if (!soundEnabled) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    await audioContext.resume();
    await prepareSound();
  } catch { /* Silent visual playback remains available when audio is blocked. */ }
}

// Preloaded Pixabay sample: start on the same frame as the card's zoom.
function ping() {
  if (!soundEnabled || !soundBuffer || audioContext?.state !== 'running' || document.hidden) return;
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  source.buffer = soundBuffer;
  gain.gain.value = .7;
  source.connect(gain).connect(audioContext.destination);
  // Skip the original sample's 80 ms leading silence to align the audible attack.
  source.start(0, .08);
  source.onended = () => { source.disconnect(); gain.disconnect(); };
}

function geometry() {
  const style = getComputedStyle(stack);
  return { height: stack.offsetHeight, gap: parseFloat(style.getPropertyValue('--card-gap')) };
}

function layout() {
  const { height, gap } = geometry();
  stack.style.setProperty('--fan-reach', `${(cards.length - 1) * (height + gap) / 2}px`);
  cards.forEach((card, index) => {
    const depth = cards.length - 1 - index;
    const y = expanded ? (depth - (cards.length - 1) / 2) * (height + gap) : depth * 13.5;
    const scale = expanded ? 1 : 1 - Math.min(depth, 3) * .055;
    card.dataset.depth = depth;
    card.style.zIndex = String(10 - depth);
    card.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
    // Keep ancestors fully opaque: opacity would isolate the glass backdrop.
  });
}

function setExpanded(value) {
  if (phase !== 'ready') return;
  expanded = value;
  stack.dataset.expanded = String(value);
  stack.setAttribute('aria-expanded', String(value));
  stack.setAttribute('aria-label', 'Continue to next section. Hover or focus to expand notifications.');
  layout();
}

function deliver() {
  const message = MESSAGES[cards.length];
  const card = document.createElement('li');
  card.className = 'notification';
  const glass = document.createElement('div');
  glass.className = 'notification-glass';
  const content = document.createElement('div');
  content.className = 'notification-content';
  const portrait = document.createElement('div');
  portrait.className = 'portrait';
  const face = scenePortraits[cards.length];
  portrait.append(face.image);
  portrait.setAttribute('aria-hidden', 'true');
  const copy = document.createElement('div');
  copy.className = 'notification-copy';
  const meta = document.createElement('div');
  meta.className = 'notification-meta';
  const sender = document.createElement('span');
  sender.className = 'sender';
  sender.textContent = message.sender;
  const timestamp = document.createElement('span');
  timestamp.className = 'timestamp';
  timestamp.textContent = 'now';
  const body = document.createElement('p');
  body.className = 'message';
  body.textContent = message.text;
  meta.append(sender, timestamp);
  copy.append(meta, body);
  content.append(portrait, copy);
  glass.append(content);
  card.append(glass);
  list.append(card);
  cards.push(card);
  layout();
  if (!reducedMotion.matches) {
    const arrival = card.animate([
      // Fast launch, then a damped bounce with zero velocity at each turn.
      { transform: 'translate3d(0,0,0) scale(.015)', offset: 0, easing: 'cubic-bezier(.16,1,.3,1)' },
      { transform: 'translate3d(0,0,0) scale(1.10)', offset: .30, easing: 'cubic-bezier(.45,0,.55,1)' },
      { transform: 'translate3d(0,0,0) scale(.97)', offset: .61, easing: 'cubic-bezier(.45,0,.55,1)' },
      { transform: 'translate3d(0,0,0) scale(1.012)', offset: .83, easing: 'cubic-bezier(.45,0,.55,1)' },
      { transform: 'translate3d(0,0,0) scale(1)', offset: 1 },
    ], { duration: TIMING.arrival });
    animations.push(arrival);
  }
  live.textContent = `${message.sender}: ${message.text}`;
  ping();
}

function deliveryTick(now) {
  if (!document.hidden && !menuOpen) elapsed += Math.min(now - tickAt, 100);
  tickAt = now;
  if (phase !== 'arriving') return;
  if (cards.length < MESSAGES.length && elapsed >= TIMING.firstMessage + cards.length * TIMING.betweenMessages) deliver();
  const readyAt = TIMING.firstMessage + (MESSAGES.length - 1) * TIMING.betweenMessages + TIMING.settle;
  if (cards.length === MESSAGES.length && elapsed >= readyAt) {
    setPhase('ready');
    document.querySelector('.opening-continue').disabled=false;
    stack.dataset.ready = 'true';
    stack.setAttribute('aria-disabled', 'false');
    stack.setAttribute('aria-label', 'Continue to next section. Hover or focus to expand notifications.');
    // Do not consume momentum from a scroll that began before the last arrival.
    lastWheelAt = performance.now();
    wheelDistance = 0;
    wheelArmed = false;
    if (document.activeElement === stack) setExpanded(true);
    return;
  }
  deliveryFrame = requestAnimationFrame(deliveryTick);
}

async function exitIntro() {
  if (phase !== 'ready') return;
  const run = generation;
  setPhase('exiting');
  stack.setAttribute('aria-disabled', 'true');
  stack.tabIndex = -1;
  const distance = innerHeight + 250;
  const drops = cards.slice().reverse().map((card, index) => {
    const start = getComputedStyle(card).transform;
    const rotation = [-13, 9, -7, 15][index];
    card.style.transition = 'none';
    const animation = card.animate(reducedMotion.matches ? [
      { opacity: 1 }, { opacity: 0 },
    ] : [
      { transform: start, offset: 0 },
      { transform: `${start} translate3d(${rotation * .2}px,-22px,0) rotate(${rotation * -.12}deg)`, offset: .17 },
      { transform: `${start} translate3d(${rotation * 7}px,${distance}px,0) rotate(${rotation}deg)`, offset: 1 },
    ], { duration: reducedMotion.matches ? 180 : TIMING.dropDuration, delay: reducedMotion.matches ? 0 : index * TIMING.dropStagger, easing: 'cubic-bezier(.55,0,.9,.45)', fill: 'forwards' });
    animations.push(animation);
    return animation.finished.catch(() => {});
  });
  const screenDrop = opening.animate(reducedMotion.matches ? [{ opacity: 1 }, { opacity: 0 }] : [
    { transform: 'translate3d(0,0,0)' },
    { transform: 'translate3d(0,105%,0)' },
  ], {
    duration: reducedMotion.matches ? 180 : 1100,
    delay: reducedMotion.matches ? 0 : 850,
    easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards',
  });
  animations.push(screenDrop);
  await Promise.all([...drops, screenDrop.finished.catch(() => {})]);
  if (generation !== run) return;
  setPhase('next');
  opening.style.visibility = 'hidden';
  opening.inert = true;
  opening.setAttribute('aria-hidden', 'true');
  nextScene.inert = false;
  nextScene.setAttribute('aria-hidden', 'false');
  video.pause();
  nextScene.focus({ preventScroll: true });
  moment.start();
  stage.dispatchEvent(new CustomEvent('intro:complete', { bubbles: true }));
}

function replay(fromEntry = false) {
  generation++;
  document.querySelector('.opening-continue').disabled=true;
  moment.reset();
  story.reset();
  dome.reset();
  finale.reset();
  casePages.reset();
  scenePortraits = choosePortraits();
  cancelAnimationFrame(deliveryFrame);
  animations.forEach(animation => animation.cancel());
  animations = [];
  cards = [];
  list.replaceChildren();
  live.textContent = '';
  expanded = false;
  pinnedOpen = false;
  stack.dataset.ready = 'false';
  stack.dataset.expanded = 'false';
  stack.setAttribute('aria-expanded', 'false');
  stack.setAttribute('aria-disabled', 'true');
  stack.setAttribute('aria-label', 'Notifications arriving');
  stack.tabIndex = 0;
  opening.inert = false;
  opening.style.visibility = '';
  videoReveal.style.opacity = '1';
  videoReveal.style.background = fromEntry ? 'url("./assets/loader/opening.webp") var(--opening-position) center / cover' : '#000';
  opening.removeAttribute('aria-hidden');
  nextScene.inert = true;
  nextScene.setAttribute('aria-hidden', 'true');
  if (nextScene.contains(document.activeElement)) document.querySelector('.logo').focus({ preventScroll: true });
  setPhase('arriving');
  video.currentTime = 0;
  const run = generation;
  let revealed = false;
  const reveal = () => {
    if (run !== generation || revealed) return;
    revealed = true;
    const fade = videoReveal.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: reducedMotion.matches ? 180 : TIMING.videoFade,
      easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards',
    });
    animations.push(fade);
    fade.finished.then(() => { if (run === generation) videoReveal.style.background = '#000'; }).catch(() => {});
  };
  if (paused) reveal();
  else if ('requestVideoFrameCallback' in video) video.requestVideoFrameCallback(reveal);
  else if (video.readyState >= 2) reveal();
  else video.addEventListener('loadeddata', reveal, { once: true });
  // Retain a useful poster if the video stalls, is unsupported, or fails to load.
  setTimeout(reveal, 3000);
  if (!paused && !document.hidden) video.play().catch(() => {});
  elapsed = 0;
  tickAt = performance.now();
  portraitsReady.then(() => {
    if (run !== generation || phase !== 'arriving') return;
    tickAt = performance.now();
    deliveryFrame = requestAnimationFrame(deliveryTick);
  });
}

stack.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') setExpanded(true); });
stack.addEventListener('pointerleave', () => { if (!pinnedOpen && document.activeElement !== stack) setExpanded(false); });
stack.addEventListener('focus', () => { if (stack.matches(':focus-visible')) setExpanded(true); });
stack.addEventListener('blur', () => { pinnedOpen = false; setExpanded(false); });
let stackTouch = false;
stack.addEventListener('pointerdown', event => { stackTouch = event.pointerType === 'touch'; });
stack.addEventListener('click', event => {
  if (phase !== 'ready' || !event.target.closest('.notification')) return;
  const touch = stackTouch || event.pointerType === 'touch' || matchMedia('(hover: none), (max-width: 520px)').matches;
  if (touch && !pinnedOpen) {
    pinnedOpen = true;
    setExpanded(true);
    stack.setAttribute('aria-label', 'Messages expanded. Tap a message to continue to the next section.');
    return;
  }
  exitIntro();
});
stack.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); exitIntro(); }
  if (event.key === 'Escape') { pinnedOpen = false; setExpanded(false); }
});

// Deliberate scroll, touch swipe, and keyboard navigation share one exit path.
window.addEventListener('wheel', event => {
  if (event.ctrlKey || document.querySelector('.video-dialog').open) return;
  if (phase === 'projects' || phase === 'case') return;
  if (phase === 'final'){if(event.deltaY < -25 && Math.abs(event.deltaY)>Math.abs(event.deltaX)){event.preventDefault();returnToTestimonials();}return;}
  if (phase === 'story') {
    const now=performance.now();
    if(event.deltaY>0 && Math.abs(event.deltaY)>Math.abs(event.deltaX)){
      if(!story.atEnd()){projectsWheelAt=now;projectsWheelDistance=0;projectsWheelArmed=false;return;}
      event.preventDefault();
      if(now-projectsWheelAt>180){projectsWheelArmed=true;projectsWheelDistance=0;}
      projectsWheelAt=now;
      if(projectsWheelArmed)projectsWheelDistance+=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
      if(projectsWheelDistance>45)continueFinal();
      return;
    }
    if(storyRoot.scrollTop>1 || event.deltaY>=0 || Math.abs(event.deltaX)>=Math.abs(event.deltaY)){backWheelDistance=0;backWheelAt=now;return;}
    event.preventDefault();
    if(now-backWheelAt>180)backWheelDistance=0;
    backWheelAt=now;
    backWheelDistance+=-event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
    if(backWheelDistance>45)returnToPortfolioFromStory();
    return;
  }
  if (phase === 'next' && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
    event.preventDefault();
    const now=performance.now();
    if(!moment.canContinue()){storyWheelAt=now;storyWheelDistance=0;storyWheelArmed=false;return;}
    if(now-storyWheelAt>180){storyWheelDistance=0;storyWheelArmed=true;}
    storyWheelAt=now;storyWheelDistance=Math.max(0,storyWheelDistance+event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1));
    if(storyWheelArmed && storyWheelDistance>45)continuePortfolio();return;
  }
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
  event.preventDefault();
  if (phase !== 'ready') { lastWheelAt = performance.now(); return; }
  const now = performance.now();
  if (now - lastWheelAt > 180) { wheelDistance = 0; wheelArmed = true; }
  lastWheelAt = now;
  if (!wheelArmed) return;
  wheelDistance = Math.max(0, wheelDistance + event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1));
  if (wheelDistance > 45) exitIntro();
}, { passive: false });
window.addEventListener('touchstart', event => { if(event.target.closest('.testimonials,.team-strip')){touchStartY=null;return;}storyTouchAtEnd=phase==='story' && story.atEnd();touchStartY = (phase === 'ready' || phase === 'final' || (phase === 'story' && (storyRoot.scrollTop<=1 || storyTouchAtEnd))) ? event.touches[0].clientY : null; }, { passive: true });
window.addEventListener('touchend', event => {
  if (touchStartY !== null) {
    const dy=touchStartY-event.changedTouches[0].clientY;
    if(phase==='final' && dy < -45)returnToTestimonials();
    else if(phase==='story' && storyTouchAtEnd && dy>45)continueFinal();
    else if(phase==='story' && dy < -45 && storyRoot.scrollTop<=1)returnToPortfolioFromStory();
    else if(phase==='ready' && dy>45)exitIntro();
  }
  touchStartY = null;
}, { passive: true });
window.addEventListener('keydown', event => {
  if (document.querySelector('.video-dialog').open || phase==='projects' || phase==='case') return;
  if(phase==='final' && ['ArrowUp','PageUp'].includes(event.key)){event.preventDefault();returnToTestimonials();return;}
  if (phase === 'story') {
    if(story.atEnd() && ['ArrowDown','PageDown',' '].includes(event.key) && !event.repeat && !event.target.closest('button,a,input,textarea')){event.preventDefault();continueFinal();return;}
    if(storyRoot.scrollTop<=1 && ['ArrowUp','PageUp'].includes(event.key) && !event.target.closest('button,a,input,textarea')){event.preventDefault();returnToPortfolioFromStory();}
    return;
  }
  if (phase === 'next' && ['PageDown','End',' '].includes(event.key) && !event.target.closest('button,a')) { event.preventDefault(); continuePortfolio(); return; }
  const controlSpace = event.key === ' ' && event.target.closest('button, a, [role="button"]');
  if (!event.defaultPrevented && !controlSpace && ['ArrowDown', 'PageDown', 'End', ' '].includes(event.key)) {
    event.preventDefault(); exitIntro();
  }
  if (!['loading', 'entry', 'starting'].includes(stage.dataset.phase)) unlockAudio();
});
window.addEventListener('pointerdown', event => {
  if (!['loading', 'entry', 'starting'].includes(stage.dataset.phase) && !event.target.closest('.sound-button, .sound-setting')) unlockAudio();
});
function syncMotion() {
  const motionPaused=paused||menuOpen;
  stage.dataset.motionPaused=String(motionPaused);
  stage.dispatchEvent(new Event('motionchange'));
  motionButton.setAttribute('aria-label', paused ? 'Resume motion' : 'Pause motion');
  motionButton.title = paused ? 'Resume motion' : 'Pause motion';
  motionButton.setAttribute('aria-pressed', String(paused));
  moment.setPaused(motionPaused);
  story.setPaused(motionPaused);
  dome.setPaused(motionPaused);
  finale.setPaused(motionPaused);
  casePages.setPaused(motionPaused);
  if (motionPaused || document.hidden || ['loading', 'entry', 'starting', 'next', 'story', 'story-transition', 'projects', 'projects-transition', 'final', 'final-transition','case','case-transition'].includes(stage.dataset.phase)) video.pause();
  else video.play().catch(() => {});
}
motionButton.addEventListener('click', () => { paused = !paused; syncMotion(); });
reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; syncMotion(); });
document.addEventListener('visibilitychange', () => { tickAt = performance.now(); syncMotion(); });
window.addEventListener('resize', () => { if (phase !== 'exiting' && phase !== 'next') layout(); });
document.querySelectorAll('.logo').forEach(button => button.addEventListener('click', event => { event.preventDefault(); replay(); }));
syncMotion();
setupSpotlight(stage);
const requestedWindow=new URLSearchParams(location.search).get('open');
const linkedWindow=['contact','search'].includes(requestedWindow)?requestedWindow:null;
const initialRoute=linkedWindow?'studio':readRoute(location.hash,location.pathname);
if(initialRoute==='loader')prepareEntry({ stage, soundBytes:loadSound(), onEnter: async sound => {
  soundEnabled = sound;
  if (sound) music.play();
  else music.pause();
  moment.prepare();
  if (sound) {
    await Promise.race([unlockAudio(), new Promise(resolve => setTimeout(resolve, 1500))]);
  }
  replay(true);
} });
else openSection(initialRoute);
if(linkedWindow){
 history.replaceState(null,'',`/?open=${linkedWindow}#/studio`);
 if(linkedWindow==='contact')studioMenu.openContact();else studioMenu.open();
 const linkedDialog=document.querySelector('dialog[open]');
 linkedDialog?.addEventListener('close',()=>{
  const url=new URL(location.href);url.searchParams.delete('open');
  history.replaceState(null,'',url.pathname+url.search+url.hash);
 },{once:true});
}
window.addEventListener('hashchange',()=>location.reload());
window.addEventListener('popstate',()=>location.reload());

async function continuePortfolio() {
  if(phase !== 'next' || !moment.canContinue())return;
  const run=generation;setPhase('tornado-exit');
  nextScene.classList.add('moment-leaving');
  await moment.leave();
  if(run!==generation)return;
  nextScene.inert=true;nextScene.setAttribute('aria-hidden','true');
  setPhase('projects');dome.start();
}
document.querySelector('.moment-continue').addEventListener('click',continuePortfolio);

function returnToMoment() {
  if(phase!=='story' && phase!=='projects')return;
  story.reset();dome.stop();
  moment.resume();
  nextScene.inert=false;nextScene.setAttribute('aria-hidden','false');
  setPhase('next');
  storyWheelAt=performance.now();storyWheelDistance=0;storyWheelArmed=false;
  backWheelDistance=0;
  nextScene.focus({preventScroll:true});
}

async function continueFinal(force=false){
  if(phase!=='story' || (!force && !story.atEnd()))return;
  const run=generation;setPhase('projects-transition');
  await story.leave();
  if(run!==generation)return;
  setPhase('final');finale.start();
}
document.querySelector('.projects-back').addEventListener('click',()=>{if(phase==='projects')returnToMoment();});
document.querySelector('.projects-next').addEventListener('click',async()=>{
 if(phase!=='projects')return;const run=generation;setPhase('portfolio-exit');await dome.leave();if(run!==generation)return;setPhase('story');story.start();
});
function returnToPortfolioFromStory(){if(phase!=='story')return;story.reset();setPhase('projects');dome.start();}
function returnToTestimonials(){if(phase!=='final')return;finale.reset();setPhase('story');story.resumeTestimonials();projectsWheelAt=performance.now();projectsWheelDistance=0;projectsWheelArmed=false;}
function openSection(route){
 soundEnabled=false;document.querySelector('.entry').hidden=true;document.querySelector('.entry').inert=true;document.querySelector('.site-header').inert=false;
 if(route==='opening'){replay();return;}
 opening.inert=true;opening.style.visibility='hidden';opening.setAttribute('aria-hidden','true');video.pause();
 if(route==='moment'){setPhase('next');nextScene.inert=false;nextScene.setAttribute('aria-hidden','false');moment.start();}
 else if(['approach','clients','testimonials'].includes(route)){setPhase('story');story.start({approach:0,clients:2.28,testimonials:3.335}[route]);dome.prepare();}
 else if(route==='projects'){setPhase('projects');dome.start();}
 else if(route.startsWith('project/')){setPhase('case');updateRoute(route);casePages.start(route.slice(8));}
 else if(route==='studio'){setPhase('final');finale.start();}
}

document.querySelector('.opening-continue').addEventListener('click',exitIntro);
document.querySelector('.story-continue').addEventListener('click',()=>continueFinal(true));

async function openProject(id,card){
 if(phase!=='projects')return;
 const slug=PROJECT_SLUGS[id];if(!slug)return;
 const run=generation;setPhase('case-transition');
 await dome.openProject(card);if(run!==generation)return;
 setPhase('case');updateRoute(`project/${slug}`,true);casePages.start(slug);
}
function closeProject(){if(phase!=='case')return;casePages.reset();setPhase('projects');dome.start();}

function menuNavigate(href){
 const url=new URL(href,location.origin);const route=readRoute(url.hash,url.pathname);
 if(url.origin!==location.origin||route==='loader')return false;
 generation++;cancelAnimationFrame(deliveryFrame);moment.reset();story.reset();dome.reset();finale.reset();casePages.reset();
 opening.getAnimations({subtree:true}).forEach(a=>a.cancel());
 nextScene.inert=true;nextScene.setAttribute('aria-hidden','true');
 const previousSound=soundEnabled;openSection(route);soundEnabled=previousSound;return true;
}
