// Shared white-to-yellow pixel pulse, using each control's own laid-out label and icon.
export function setupButtonPixels(reduced){
 document.querySelectorAll('button:not(.video-play):not(.notifications):not(.studio-disk):not(.menu-close):not(.floppy-grip):not(.budget-selection):not(.menu-result),a.case-back,a.case-return').forEach(button=>{
  if(button.dataset.pixelHoverReady)return;button.dataset.pixelHoverReady='true';
  if(getComputedStyle(button).position==='static')button.style.position='relative';
  const canvas=document.createElement('canvas'),source=document.createElement('canvas'),small=document.createElement('canvas');canvas.className='button-pixels';canvas.setAttribute('aria-hidden','true');button.append(canvas);
  const ctx=canvas.getContext('2d'),paint=source.getContext('2d'),sample=small.getContext('2d');let frame,hover=false,focus=false;
  async function update(){cancelAnimationFrame(frame);const active=hover||focus;if(button.disabled)return;
   if(!active){button.classList.remove('button-yellow','button-pixelating');return;}
   const r=button.getBoundingClientRect();if(!r.width)return;source.width=canvas.width=Math.ceil(r.width*2);source.height=canvas.height=Math.ceil(r.height*2);
   const profile=button.classList.contains('profile-button'),contact=button.classList.contains('contact');paint.fillStyle=profile?'#fff':'#ffff40';paint.fillRect(0,0,source.width,source.height);
   const walker=document.createTreeWalker(button,NodeFilter.SHOW_TEXT),nodes=[];
   while(walker.nextNode())if(walker.currentNode.textContent.trim())nodes.push(walker.currentNode);
   for(const n of nodes){
    const s=getComputedStyle(n.parentElement),range=document.createRange();range.selectNodeContents(n);
    const box=range.getBoundingClientRect();
    // A zero-height inline marker measures the browser's actual alphabetic baseline.
    // Wrap direct flex text so the marker cannot become a separate flex item.
    const wrap=document.createElement('span'),marker=document.createElement('span');
    wrap.style.cssText='padding:0;margin:0;border:0';
    marker.style.cssText='display:inline-block;width:0;height:0;padding:0;margin:0;border:0;vertical-align:baseline';
    n.before(wrap);wrap.append(n,marker);const baseline=marker.getBoundingClientRect().top;
    wrap.replaceWith(n);
    paint.font=`${s.fontStyle} ${s.fontWeight} ${parseFloat(s.fontSize)*2}px ${s.fontFamily}`;
    paint.letterSpacing=s.letterSpacing==='normal'?'0px':`${parseFloat(s.letterSpacing)*2}px`;
    paint.fillStyle='#111';paint.textBaseline='alphabetic';
    const text=s.textTransform==='uppercase'?n.textContent.trim().toUpperCase():s.textTransform==='lowercase'?n.textContent.trim().toLowerCase():n.textContent.trim();
    paint.fillText(text,(box.left-r.left)*2,(baseline-r.top)*2);
   }
   for(const img of button.querySelectorAll('img')){try{await img.decode();const box=img.getBoundingClientRect();paint.save();paint.filter=button.classList.contains('profile-button')||button.classList.contains('menu-close')||contact?'none':'brightness(0)';paint.drawImage(img,(box.left-r.left)*2,(box.top-r.top)*2,box.width*2,box.height*2);paint.restore();}catch{}}
   if(contact){const pixels=paint.getImageData(0,0,source.width,source.height);for(let i=0;i<pixels.data.length;i+=4){const light=(pixels.data[i]+pixels.data[i+1]+pixels.data[i+2])/765;pixels.data[i]=pixels.data[i+1]=Math.round(255*(1-light));pixels.data[i+2]=Math.round(64*(1-light));}paint.putImageData(pixels,0,0);}
   if(profile){const pixels=paint.getImageData(0,0,source.width,source.height);for(let i=0;i<pixels.data.length;i+=4){if(pixels.data[i]>140&&pixels.data[i+1]>140&&pixels.data[i+2]<150){pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=255;}}paint.putImageData(pixels,0,0);}
   if(!hover&&!focus)return;button.classList.add('button-pixelating');const start=performance.now();
   function tick(now){const p=reduced.matches?1:Math.min(1,(now-start)/650),block=Math.max(1,Math.round(Math.sin(p*Math.PI)*12));small.width=Math.ceil(source.width/block);small.height=Math.ceil(source.height/block);sample.drawImage(source,0,0,small.width,small.height);ctx.imageSmoothingEnabled=false;ctx.globalAlpha=1;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.globalAlpha=Math.min(1,p*4);ctx.drawImage(small,0,0,canvas.width,canvas.height);if(p<1)frame=requestAnimationFrame(tick);else{button.classList.add('button-yellow');button.classList.remove('button-pixelating');}}
   frame=requestAnimationFrame(tick);
  }
  button.addEventListener('pointerenter',()=>{hover=true;update();});button.addEventListener('pointerleave',()=>{hover=false;update();});button.addEventListener('focus',()=>{focus=button.matches(':focus-visible');update();});button.addEventListener('blur',()=>{focus=false;update();});
 });
}

// Rasterize the arrow through coarse-to-fine cells when continuation unlocks.
export function setupArrowReveals(reduced){
 document.querySelectorAll('.section-continue,.moment-continue').forEach(button=>{
  const canvas=document.createElement('canvas');canvas.className='arrow-materialize';canvas.width=canvas.height=72;canvas.setAttribute('aria-hidden','true');button.append(canvas);
  const source=document.createElement('canvas');source.width=source.height=72;const ink=source.getContext('2d');ink.strokeStyle='#ddd';ink.lineWidth=3;ink.lineCap='round';ink.beginPath();ink.moveTo(36,21);ink.lineTo(36,50);ink.moveTo(24,39);ink.lineTo(36,51);ink.lineTo(48,39);ink.stroke();
  const small=document.createElement('canvas'),ctx=canvas.getContext('2d');let ready=false,frame;
  function sync(){const next=!button.disabled&&(!button.classList.contains('story-continue')||button.classList.contains('available'));if(next===ready)return;ready=next;cancelAnimationFrame(frame);ctx.clearRect(0,0,72,72);button.classList.remove('arrow-materializing');if(!ready||reduced.matches)return;button.classList.add('arrow-materializing');const start=performance.now();
   function tick(now){const p=Math.min(1,(now-start)/850),cells=Math.round(5+31*p*p);small.width=small.height=cells;small.getContext('2d').drawImage(source,0,0,cells,cells);ctx.clearRect(0,0,72,72);ctx.imageSmoothingEnabled=false;ctx.drawImage(small,0,0,72,72);if(p<1)frame=requestAnimationFrame(tick);else{ctx.clearRect(0,0,72,72);button.classList.remove('arrow-materializing');}}frame=requestAnimationFrame(tick);
  }
  new MutationObserver(sync).observe(button,{attributes:true,attributeFilter:['disabled','class']});sync();
 });
}
