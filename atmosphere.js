import {chooseAnalytics} from './measurement.js';
import {animateEntryBackground} from './entry-background.js';
// Bounded loading reveal followed by a still-image dither treatment.
export async function prepareEntry({ stage, soundBytes, onEnter }) {
  const entry = document.querySelector('.entry');
  const image = document.querySelector('.entry-image');
  const canvas = document.querySelector('.entry-dither');
  const spotlight = document.querySelector('.entry-spotlight');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const loadImage = (src, priority = 'auto') => {
    const asset = new Image();
    asset.fetchPriority = priority;
    asset.src = src;
    return asset.decode();
  };
  const assets = [
    image.decode(),
    loadImage('./assets/portraits/notification-grid-16.webp', 'high'),
    loadImage('./assets/logo.svg'),
    loadImage('./assets/loader/logo.svg'),
    loadImage('./assets/loader/sound-on.svg'),
    loadImage('./assets/loader/sound-off.svg'),
    document.fonts.load('18px "Restart Soft"'),
    document.fonts.load('500 11px "Restart Soft"'),
    document.fonts.load('10px "ABC Diatype Mono"'),
    soundBytes,
  ];
  let completed = 0;
  let resourcesReady = false;
  let lastStep = -1;
  const bayer = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  function drawDither(step, target = canvas) {
    const isSpotlight = target === spotlight;
    const ctx = isSpotlight ? target.getContext('2d', { willReadFrequently: true }) : context;
    if (!ctx || !image.naturalWidth) return;
    const pixel = isSpotlight ? 3 : [4,3,2][step];
    const width = Math.min(stage.clientWidth, 1600);
    target.width = Math.max(1, Math.ceil(width / pixel));
    target.height = Math.max(1, Math.ceil(width * stage.clientHeight / stage.clientWidth / pixel));
    const cover = Math.max(target.width / image.naturalWidth, target.height / image.naturalHeight);
    const w = image.naturalWidth * cover, h = image.naturalHeight * cover;
    const focalPoint = parseFloat(getComputedStyle(stage).getPropertyValue('--opening-position')) / 100;
    ctx.drawImage(image, (target.width-w)*focalPoint, (target.height-h)/2, w, h);
    const frame = ctx.getImageData(0,0,target.width,target.height);
    const data = frame.data;
    for (let y = 0; y < target.height; y++) {
      for (let x = 0; x < target.width; x++) {
        const i = (y * target.width + x) * 4;
        const threshold = (bayer[(y%4)*4+x%4] + .5) / 16 - .5;
        const gray = data[i]*.2126 + data[i+1]*.7152 + data[i+2]*.0722;
        const levels = isSpotlight ? 5 : [6,12,24][step];
        for (let channel = 0; channel < 3; channel++) {
          const value = isSpotlight ? data[i+channel] * 1.14 : data[i+channel];
          data[i+channel] = Math.max(0, Math.min(255, Math.round(value/255*levels + threshold) / levels * 255));
        }
      }
    }
    ctx.putImageData(frame,0,0);
  }
  // A slow or failed asset never traps the visitor behind the loader.
  let timeout;
  Promise.race([
    Promise.allSettled(assets.map(promise => promise.finally(() => { completed++; }))),
    new Promise(resolve => { timeout = setTimeout(resolve, 4500); }),
  ]).then(() => { clearTimeout(timeout); resourcesReady = true; });
  const start = performance.now();
  await new Promise(resolve => {
    function frame(now) {
      const elapsed = now-start;
      const visual = Math.min(1, elapsed / (reduced.matches ? 100 : 1600));
      const progress = Math.min(visual, resourcesReady ? 1 : completed/assets.length*.95);
      entry.style.setProperty('--load-progress', `${progress*100}%`);
      const step = Math.min(2, Math.floor(progress*3));
      if (!reduced.matches && image.complete && image.naturalWidth && step !== lastStep) {
        drawDither(step);
        lastStep = step;
        canvas.style.opacity = '1';
      }
      if (resourcesReady && visual === 1) { resolve(); return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
  image.style.opacity = '1';
  const {animateEntryLogo}=await import('./logo-animation.js');
  const disposeLogo=await animateEntryLogo(document.querySelector('.entry-logo'),reduced.matches).catch(()=>{document.querySelector('.entry-logo').innerHTML='<img src="./assets/loader/logo.svg" alt="garcy.studio" style="opacity:1">';});
  entry.classList.add('entry-ready');
  canvas.style.opacity = '0';
  // Bake the image once; pointer movement only changes the soft CSS mask.
  const renderSpotlight = () => {
    if (!entry.inert && !reduced.matches && matchMedia('(hover:hover) and (pointer:fine)').matches) drawDither(2, spotlight);
  };
  const observer = new ResizeObserver(renderSpotlight);
  observer.observe(stage);
  image.addEventListener('load', renderSpotlight);
  renderSpotlight();
  stage.dataset.phase = 'entry';
  document.querySelector('.entry-status').hidden = true;
  document.querySelector('.entry-actions').hidden = false;
  let entered=false;
  const stopBackground=animateEntryBackground(image,canvas,stage,reduced);
  const enter = async sound => {
    if (entered) return;
    entered = true;stopBackground();
    observer.disconnect();
    image.removeEventListener('load', renderSpotlight);
    stage.dataset.phase = 'starting';
    // onEnter resumes AudioContext directly inside this trusted click callback.
    await onEnter(sound);
    entry.classList.add('leaving');
    entry.inert = true;
    document.querySelector('.site-header').inert = false;
    document.querySelector('.opening').focus({ preventScroll: true });
    setTimeout(() => { entry.hidden = true;disposeLogo?.(); canvas.width = canvas.height = spotlight.width = spotlight.height = 1; }, 750);
  };
  const confirmEntry = consent => {
    chooseAnalytics(consent?'yes':'no');
    document.querySelector('[data-analytics-preference]')?.remove();
    enter(true);
  };
  document.querySelector('.enter-sound').addEventListener('click', () => confirmEntry(true));
  document.querySelector('.enter-silent').addEventListener('click', () => confirmEntry(false));
}

export function setupSpotlight(stage) {
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const lights=[...stage.querySelectorAll('.spotlight,.entry-spotlight')];
  let left=stage.offsetLeft,top=stage.offsetTop;
  window.addEventListener('resize',()=>{left=stage.offsetLeft;top=stage.offsetTop;});
  let scheduled = false;
  let x = 0, y = 0;
  stage.addEventListener('pointermove', event => {
    if (!fine.matches || reduced.matches || event.pointerType !== 'mouse') return;
    x = event.clientX-left;
    y = event.clientY-top;
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      lights.forEach(light=>{light.style.setProperty('--light-x', `${x}px`);light.style.setProperty('--light-y', `${y}px`);});
      if(stage.dataset.light!=='true')stage.dataset.light = 'true';
      scheduled = false;
    });
  }, { passive: true });
  stage.addEventListener('pointerleave', () => { stage.dataset.light = 'false'; });
}
