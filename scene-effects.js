// Small, cached ordered-dither masks dissolve live DOM without taking screenshots.
let masks;
function ditherMasks(){
  if(masks)return masks;
  const bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;
  const ctx=canvas.getContext('2d');if(!ctx)return [];
  masks=Array.from({length:17},(_,level)=>{
    ctx.clearRect(0,0,32,32);ctx.fillStyle='#fff';
    bayer.forEach((value,i)=>{if(value>=level)ctx.fillRect(i%4*8,Math.floor(i/4)*8,8,8);});
    return `url("${canvas.toDataURL()}")`;
  });return masks;
}
export function flyAwayInPixels(element,reduced){
  const textures=ditherMasks();let frame,resolve,finished=false;
  const duration=reduced?180:1450,start=performance.now();
  const animation=element.animate(reduced?[{opacity:1},{opacity:0}]:[
    {translate:'0 0',opacity:1},{translate:'0 -115vh',opacity:0}
  ],{duration,easing:'cubic-bezier(.55,0,.8,.4)',fill:'forwards'});
  const done=new Promise(r=>resolve=r);
  function finish(){if(finished)return;finished=true;cancelAnimationFrame(frame);resolve();}
  function draw(now){
    const p=Math.min(1,(now-start)/duration);
    const level=Math.min(16,Math.floor(Math.max(0,(p-.15)/.85)*17));
    if(!reduced && textures.length){element.style.maskImage=textures[level];element.style.maskSize='32px 32px';}
    if(p<1)frame=requestAnimationFrame(draw);
  }
  frame=requestAnimationFrame(draw);animation.finished.then(finish,finish);
  return {done,cancel(){finish();animation.cancel();element.style.maskImage='';element.style.maskSize='';}};
}

export function scatterInPixels(elements,reduced,startDelay=0){
 const effects=elements.map((element,i)=>{
  const textures=ditherMasks(),duration=reduced?160:1100+Math.random()*450,delay=reduced?0:startDelay+Math.random()*160;
  const animation=element.animate(reduced?[{opacity:1},{opacity:0}]:[{translate:'0 0',rotate:'0deg',opacity:1},{translate:`${(Math.random()-.5)*60}vw -125vh`,rotate:`${(Math.random()-.5)*45}deg`,opacity:0}],{duration,delay,easing:'cubic-bezier(.45,0,.8,.3)',fill:'forwards'});
  let frame;const start=performance.now()+delay;
  function draw(now){const p=Math.max(0,Math.min(1,(now-start)/duration));if(!reduced){element.style.maskImage=textures[Math.min(16,Math.floor(p*p*17))];element.style.maskSize='32px 32px';}if(p<1)frame=requestAnimationFrame(draw);}
  frame=requestAnimationFrame(draw);
  return {done:animation.finished.catch(()=>{}),cancel(){cancelAnimationFrame(frame);animation.cancel();element.style.maskImage=element.style.maskSize='';}};
 });
 return {done:Promise.all(effects.map(e=>e.done)),cancel(){effects.forEach(e=>e.cancel());}};
}

// Lift cards out of the horizontally clipped carousel before their vertical flight.
export function departStory(viewport,textElements,cards,reduced){
 const rect=viewport.getBoundingClientRect(),layer=document.createElement('div');layer.className='story-departure';viewport.append(layer);
 const visible=cards.map(card=>({card,rect:card.getBoundingClientRect(),opacity:card.style.opacity})).filter(({rect:r})=>r.right>rect.left&&r.left<rect.right);
 const clones=visible.map(({card,rect:r})=>{const clone=card.cloneNode(true);clone.querySelectorAll('canvas').forEach(c=>c.remove());clone.classList.remove('card-resolving');Object.assign(clone.style,{position:'absolute',left:`${r.left-rect.left}px`,top:`${r.top-rect.top}px`,width:`${r.width}px`,height:`${r.height}px`,transform:'none',opacity:'1',backdropFilter:'none',webkitBackdropFilter:'none'});layer.append(clone);card.style.opacity='0';return clone;});
 const textEffects=textElements.map(el=>flyAwayInPixels(el,reduced));
 const cardEffect=scatterInPixels(clones,reduced,300);
 return {done:Promise.all([...textEffects.map(e=>e.done),cardEffect.done]),cancel(){textEffects.forEach(e=>e.cancel());cardEffect.cancel();layer.remove();visible.forEach(({card,opacity})=>card.style.opacity=opacity);}};
}
