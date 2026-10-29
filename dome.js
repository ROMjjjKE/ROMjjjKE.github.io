import {CANVAS_IMAGES} from './canvas-images.js';
import {pixelCard} from './card-effects.js';
// Desktop 06. Dome/lens projection adapted from Jesper Landberg’s Infinite Dome Grid,
// accessed through the user’s Osmo membership. See source-media/projects/SOURCE.md.
const mod=(value,size)=>((value%size)+size)%size;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export function wrapPosition(value,period){return mod(value+period/2,period)-period/2;}
// Complete rows contain every project; stagger adjacent rows by three cards.
// Never wrap a partly filled row: that placed the first project beside itself.
export function gridPeriods(count){return {columns:count,rows:Math.max(1,Math.floor(count/3))};}
export function gridCell(column,row,count=9){return mod(column+1+mod(row+1,gridPeriods(count).rows)*3,count);}

export function createDome(reducedMotion,onProject=()=>{}){
  const root=document.querySelector('.projects');
  const surface=root.querySelector('.dome-surface');
  const originals=[...root.querySelectorAll('.project-card')];
  const templates=originals.map(card=>card.cloneNode(true));
  let pool=[],columns=0,rows=0,left=0,top=0;
  function buildPool(){
    // Whole staggered periods keep seams duplicate-free without swapping live images.
    const periods=gridPeriods(templates.length);
    const cols=Math.ceil((Math.ceil(width/stepX)+2)/periods.columns)*periods.columns;
    const period=periods.rows;
    const nextRows=Math.ceil((Math.ceil(height/stepY)+2)/period)*period;
    if(cols===columns && nextRows===rows)return;
    columns=cols;rows=nextRows;
    const fragment=document.createDocumentFragment();pool=[];
    for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
      const column=col-Math.floor(columns/2),line=row-Math.floor(rows/2);
      const card=templates[gridCell(column,line,templates.length)].cloneNode(true);
      card.setAttribute('role','link');card.setAttribute('aria-label',`View ${card.querySelector('h3').textContent}`);card.tabIndex=-1;card.classList.add('dome-tile');
      const image=card.querySelector('img');image.loading='eager';image.removeAttribute('src');image.draggable=false;image.style.opacity='0';
      fragment.append(card);pool.push({card,image,column,line,visible:null});
    }
    surface.replaceChildren(fragment);
  }
  let active=false,paused=reducedMotion.matches;
  let x=0,y=0,targetX=0,targetY=0,vx=0,vy=0,pointer=null,dragX=0,dragY=0,dragTargetX=0,dragTargetY=0;
  let width=0,height=0,cardWidth=0,cardHeight=0,stepX=0,stepY=0;
  let cursorX=0,cursorY=0,cursorTargetX=0,cursorTargetY=0,lens=0,lensTarget=0;
  let entrance,departures=[],arrivals=[],arrivalRun=0,pressedCard=null,dragDistance=0;
  function cancelArrivals(){arrivalRun++;arrivals.forEach(a=>a.cancel());arrivals=[];}
  function flightOffset(card){const r=card.getBoundingClientRect();let dx=r.left+r.width/2-innerWidth/2,dy=r.top+r.height/2-innerHeight/2;const length=Math.hypot(dx,dy)||1;dx=dx/length*innerWidth*1.4;dy=dy/length*innerHeight*1.6;if(length<60){dx=innerWidth;dy=-innerHeight;}return {dx,dy};}
  // No full-resolution preload of the entire project catalogue.
  function prepare(){return Promise.resolve();}
  function loadTile(tile,priority){
    if(tile.loading)return;
    tile.loading=true;
    const original=tile.image.dataset.deferSrc||tile.image.getAttribute('src');
    const variants=CANVAS_IMAGES[original?.replace(/^\//,'')];
    const wanted=cardWidth*Math.min(devicePixelRatio||1,2);
    const selected=variants?.find(([,w])=>w>=wanted)||variants?.at(-1);
    tile.image.fetchPriority=priority?'high':'low';
    tile.image.src=selected?'/'+selected[0]:original;
    tile.image.decode().then(()=>{tile.image.style.opacity='1';}).catch(()=>{tile.image.style.opacity='1';});
  }
  function measure(){
    const bounds=root.getBoundingClientRect();left=bounds.left;top=bounds.top;
    width=root.clientWidth;height=root.clientHeight;
    cardWidth=clamp(width/3.12,245,560);cardHeight=cardWidth*498.006/458;
    stepX=cardWidth+Math.max(4,cardWidth*.014);stepY=cardHeight+Math.max(4,cardWidth*.014);
    root.style.setProperty('--project-width',`${cardWidth}px`);
    root.style.setProperty('--project-height',`${cardHeight}px`);
    root.style.setProperty('--project-scale',String(cardWidth/458));
    buildPool();

  }
  function paint(){

    function warp(px,py){
      const nx=px/(width/2),ny=py/(height/2);
      const factor=1+.15*(nx*nx+ny*ny);
      let wx=px*factor,wy=py*factor;
      const dx=wx-cursorX,dy=wy-cursorY,reach=stepX*1.5;
      const push=.25*lens*Math.exp(-(dx*dx+dy*dy)/(reach*reach));
      return {x:wx+dx*push,y:wy+dy*push};
    }
    pool.forEach(tile=>{
      const px=wrapPosition(tile.column*stepX+x,columns*stepX);
      const py=wrapPosition(tile.line*stepY+y,rows*stepY);
      const visible=Math.abs(px)<width/2+stepX && Math.abs(py)<height/2+stepY;
      if(tile.visible!==visible){tile.card.style.visibility=visible?'visible':'hidden';tile.card.setAttribute('aria-hidden',String(!visible));tile.card.tabIndex=visible?0:-1;tile.visible=visible;}
      if(!visible)return;
      loadTile(tile,Math.abs(px)<width/2 && Math.abs(py)<height/2);
      const q=[warp(px-stepX/2,py-stepY/2),warp(px+stepX/2,py-stepY/2),warp(px-stepX/2,py+stepY/2),warp(px+stepX/2,py+stepY/2)];
      const inset=(c,a,b)=>{
        const da=Math.hypot(a.x-c.x,a.y-c.y)||1,db=Math.hypot(b.x-c.x,b.y-c.y)||1,gap=(stepX-cardWidth)/2;
        return {x:c.x+gap*((a.x-c.x)/da+(b.x-c.x)/db),y:c.y+gap*((a.y-c.y)/da+(b.y-c.y)/db)};
      };
      const corners=[inset(q[0],q[1],q[2]),inset(q[1],q[0],q[3]),inset(q[2],q[0],q[3]),inset(q[3],q[1],q[2])];
      tile.card.style.transform=quadMatrix(corners,cardWidth,cardHeight);
      const driftX=clamp((cursorX-px)/(stepX*1.5),-1,1)*12*lens;
      const driftY=clamp((cursorY-py)/(stepX*1.5),-1,1)*12*lens;
      tile.image.style.transform=`translate3d(${driftX}px,${driftY}px,0) scale(1.04)`;
    });
  }
  function tick(now,dt){
    if(!active || document.hidden)return false;
    if(pointer===null && !paused && !reducedMotion.matches){
      targetX+=vx*dt/16.67;targetY+=vy*dt/16.67;
      vx*=Math.pow(.9,dt/16.67);vy*=Math.pow(.9,dt/16.67);
    }
    const blend=reducedMotion.matches?1:1-Math.pow(.9,dt/16.67);
    x+=(targetX-x)*blend;y+=(targetY-y)*blend;
    cursorX+=(cursorTargetX-cursorX)*(1-Math.pow(.88,dt/16.67));
    cursorY+=(cursorTargetY-cursorY)*(1-Math.pow(.88,dt/16.67));
    const calm=1/(1+(Math.abs(targetX-x)+Math.abs(targetY-y))/40);
    const desiredLens=paused || reducedMotion.matches?0:lensTarget*calm;
    lens+=(desiredLens-lens)*(1-Math.pow(.92,dt/16.67));
    paint();
    return pointer!==null || Math.abs(x-targetX)+Math.abs(y-targetY)>.1 || Math.abs(vx)+Math.abs(vy)>.1 || Math.abs(cursorX-cursorTargetX)+Math.abs(cursorY-cursorTargetY)>.1 || Math.abs(lens-desiredLens)>.001;
  }
  const loop=createFrameLoop(tick);
  function wake(){if(active && !document.hidden)loop.wake();}
  surface.addEventListener('pointerdown',e=>{
    if(!active || e.button!==0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)return;
    pressedCard=e.target.closest('.dome-tile');dragDistance=0;pointer=e.pointerId;dragX=e.clientX;dragY=e.clientY;dragTargetX=targetX;dragTargetY=targetY;vx=vy=0;
    surface.setPointerCapture(pointer);root.classList.add('dome-dragging');root.focus({preventScroll:true});wake();
  });
  surface.addEventListener('pointermove',e=>{
    if(!active)return;
    if(e.pointerType==='mouse'){cursorTargetX=e.clientX-left-width/2;cursorTargetY=e.clientY-top-height/2;lensTarget=1;wake();}
    if(e.pointerId!==pointer)return;
    const dx=e.clientX-dragX,dy=e.clientY-dragY;dragDistance=Math.max(dragDistance,Math.hypot(dx,dy));
    const speed=e.pointerType==='touch'?2.5:1.5;
    targetX=dragTargetX+dx*speed;targetY=dragTargetY+dy*speed;vx=vy=0;wake();
  });
  surface.addEventListener('click',e=>{if(e.target.closest('a')&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey)e.preventDefault();});
  surface.addEventListener('dragstart',e=>e.preventDefault());
  surface.addEventListener('pointerleave',()=>{lensTarget=0;wake();});
  function release(e){const card=pressedCard;pressedCard=null;if(e?.type==='pointerup'&&active&&dragDistance<7&&card)onProject(card.dataset.project,card);pointer=null;root.classList.remove('dome-dragging');wake();}
  surface.addEventListener('pointerup',release);surface.addEventListener('pointercancel',release);surface.addEventListener('lostpointercapture',release);
  root.addEventListener('wheel',e=>{
    if(!active || e.ctrlKey)return;
    e.preventDefault();e.stopPropagation();
    const unit=e.deltaMode===1?16:e.deltaMode===2?height:1;
    targetX-=e.deltaX*unit;targetY-=e.deltaY*unit;vx=vy=0;wake();
  },{passive:false});
  root.addEventListener('keydown',e=>{
    if(!active || e.target.closest('button'))return;
    const tile=e.target.closest('.dome-tile');if(tile&&['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();onProject(tile.dataset.project,tile);return;}
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','PageUp','PageDown',' '].includes(e.key))return;
    e.preventDefault();e.stopPropagation();vx=vy=0;
    if(e.key==='ArrowLeft')targetX+=stepX*.7;
    if(e.key==='ArrowRight')targetX-=stepX*.7;
    if(e.key==='ArrowUp'||e.key==='PageUp')targetY+=stepY*.7;
    if(e.key==='ArrowDown'||e.key==='PageDown')targetY-=stepY*.7;
    if(e.key===' ')targetY+=(e.shiftKey?1:-1)*height*.85;
    if(e.key==='Home')targetX=targetY=0;
    wake();
  });
  function start(){
    entrance?.cancel();cancelArrivals();
    surface.style.opacity='';
    active=true;root.inert=true;root.setAttribute('aria-hidden','false');root.classList.add('projects-active');
    measure();paint();wake();
    const run=arrivalRun;
    if(reducedMotion.matches){
      entrance=surface.animate([{opacity:0},{opacity:1}],{duration:180});
      arrivals=[entrance];
    }else{
      // Reverse the canvas departure: each tile travels in from its own edge.
      // Individual translate/rotate leave the live dome projection untouched.
      arrivals=pool.filter(tile=>tile.visible).map(({card})=>{
        const {dx,dy}=flightOffset(card);
        return card.animate([
          {translate:`${dx}px ${dy}px`,rotate:`${(Math.random()-.5)*70}deg`,opacity:0},
          {translate:'0 0',rotate:'0deg',opacity:1}
        ],{duration:1450,delay:Math.random()*160,easing:'cubic-bezier(.2,.7,.25,1)',fill:'backwards'});
      });
    }
    Promise.all(arrivals.map(a=>a.finished.catch(()=>{}))).then(()=>{
      if(active&&run===arrivalRun){root.inert=false;root.focus({preventScroll:true});}
    });
  }
  function stop(){
    // Hide before cancelling filled departures, otherwise tiles snap back during the root fade.
    surface.style.opacity='0';
    active=false;loop.stop();entrance?.cancel();cancelArrivals();departures.forEach(a=>a.cancel());departures=[];
    if(pointer!==null && surface.hasPointerCapture(pointer))surface.releasePointerCapture(pointer);
    pointer=null;vx=vy=0;
    root.inert=true;root.setAttribute('aria-hidden','true');root.classList.remove('projects-active','dome-dragging');
  }
  async function leave(){
    active=false;loop.stop();root.inert=true;entrance?.cancel();cancelArrivals();
    departures=pool.filter(t=>t.visible).map(({card})=>{const {dx,dy}=flightOffset(card);
      return card.animate(reducedMotion.matches?[{opacity:1},{opacity:0}]:[{translate:'0 0',rotate:'0deg',opacity:1},{translate:`${dx}px ${dy}px`,rotate:`${(Math.random()-.5)*70}deg`,opacity:0}],{duration:reducedMotion.matches?180:1200,delay:reducedMotion.matches?0:Math.random()*160,easing:'cubic-bezier(.45,0,.8,.3)',fill:'forwards'});
    });await Promise.all(departures.map(a=>a.finished.catch(()=>{})));stop();
  }
  async function openProject(card){
    active=false;loop.stop();entrance?.cancel();cancelArrivals();root.inert=true;
    const r=card.getBoundingClientRect(),origin=`${r.left+r.width/2-left}px ${r.top+r.height/2-top}px`;
    surface.style.transformOrigin=origin;
    const effects=reducedMotion.matches?[]:pool.filter(t=>t.visible).map(t=>({card:t.card,effect:pixelCard(t.card)}));
    await Promise.all(effects.map(({effect})=>effect.prepare()));
    const pixelStart=performance.now();let pixelFrame;
    function pixelate(now){const p=Math.min(1,(now-pixelStart)/900);effects.forEach(({effect})=>effect.set(1-p*.95));if(p<1)pixelFrame=requestAnimationFrame(pixelate);}
    if(effects.length)pixelFrame=requestAnimationFrame(pixelate);
    const zoom=surface.animate(reducedMotion.matches?[{opacity:1},{opacity:0}]:[{transform:'scale(1)'},{transform:'scale(2.8)'}],{duration:reducedMotion.matches?150:650,easing:'cubic-bezier(.65,0,.25,1)',fill:'forwards'});departures.push(zoom);await zoom.finished.catch(()=>{});
    if(!reducedMotion.matches){const drop=root.animate([{transform:'translateY(0)'},{transform:'translateY(110%)'}],{duration:950,easing:'cubic-bezier(.76,0,.24,1)',fill:'forwards'});departures.push(drop);await drop.finished.catch(()=>{});}
    cancelAnimationFrame(pixelFrame);effects.forEach(({card})=>{card.classList.remove('card-resolving');card.querySelector('.card-pixels')?.remove();});stop();surface.style.transformOrigin='';
  }
  function reset(){stop();x=y=targetX=targetY=cursorX=cursorY=cursorTargetX=cursorTargetY=lens=lensTarget=0;}
  window.addEventListener('resize',()=>{if(active){measure();paint();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){loop.stop();}else wake();});
  return {prepare,start,stop,reset,leave,openProject,setPaused(value){paused=value;if(value)vx=vy=0;wake();}};
}

// Project a rectangle onto a quadrilateral with one CSS transform, including its caption.
export function quadMatrix([p0,p1,p2,p3],width,height){
  const dx1=p1.x-p3.x,dy1=p1.y-p3.y,dx2=p2.x-p3.x,dy2=p2.y-p3.y;
  const sx=p0.x-p1.x-p2.x+p3.x,sy=p0.y-p1.y-p2.y+p3.y;
  const denominator=dx1*dy2-dx2*dy1;
  const g=denominator?(sx*dy2-dx2*sy)/denominator:0;
  const h=denominator?(dx1*sy-sx*dy1)/denominator:0;
  const a=p1.x-p0.x+g*p1.x,b=p2.x-p0.x+h*p2.x;
  const d=p1.y-p0.y+g*p1.y,e=p2.y-p0.y+h*p2.y;
  return `matrix3d(${a/width},${d/width},0,${g/width},${b/height},${e/height},0,${h/height},0,0,1,0,${p0.x},${p0.y},0,1)`;
}

// Input events only wake an idle loop: they never postpone a pending frame or reset its clock.
export function createFrameLoop(render,{
  request=callback=>requestAnimationFrame(callback),
  cancel=id=>cancelAnimationFrame(id),
  now=()=>performance.now(),
}={}){
  let pending=null,last=0;
  function step(time){
    pending=null;
    const dt=Math.min(40,Math.max(0,time-last));last=time;
    if(render(time,dt))pending=request(step);
  }
  return {
    wake(){if(pending!==null)return;last=now();pending=request(step);},
    stop(){if(pending!==null)cancel(pending);pending=null;},
  };
}
