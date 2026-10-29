// Cached card artwork; scrolling only redraws a small mosaic, never reads video frames.
export function pixelCard(element){
 const canvas=document.createElement('canvas'),source=document.createElement('canvas'),small=document.createElement('canvas');
 canvas.className='card-pixels';canvas.setAttribute('aria-hidden','true');element.append(canvas);
 const ctx=canvas.getContext('2d'),paint=source.getContext('2d'),sample=small.getContext('2d');let last=-1,ready=false;
 async function prepare(){
  if(element.textContent.trim())await document.fonts.ready;
  const media=[...element.querySelectorAll('img,video')].map(async el=>{try{
   // Decode the actual responsive image before taking its snapshot or revealing it.
   // Decoding a separate Image alone does not prepare the live <picture> for paint.
   if(el.tagName==='IMG'){await el.decode();return {el,image:el};}
   const image=new Image();image.src=el.tagName==='VIDEO'?el.poster:(el.currentSrc||el.src);await image.decode();return {el,image};
  }catch{return null;}});
  const loaded=await Promise.all(media),w=element.offsetWidth,h=element.offsetHeight;if(!w||!h)return;
  source.width=canvas.width=w;source.height=canvas.height=h;paint.fillStyle=getComputedStyle(element).backgroundColor;paint.fillRect(0,0,w,h);
  const rect=element.getBoundingClientRect(),sx=w/rect.width,sy=h/rect.height;
  loaded.filter(Boolean).forEach(({el,image})=>{
   const r=el.getBoundingClientRect(),x=(r.left-rect.left)*sx,y=(r.top-rect.top)*sy,rw=r.width*sx,rh=r.height*sy;
   // Live IMG.width/height describe its CSS box, not the source pixels.
   // Use natural dimensions and the same fit/position as the live media.
   const iw=image.naturalWidth,ih=image.naturalHeight;if(!iw||!ih)return;
   const style=getComputedStyle(el),contain=style.objectFit==='contain';
   const k=contain?Math.min(rw/iw,rh/ih):Math.max(rw/iw,rh/ih);
   const [px='50%',py='50%']=style.objectPosition.split(' ');
   const offset=(value,space)=>value.endsWith('%')?space*parseFloat(value)/100:parseFloat(value)||0;
   paint.save();paint.beginPath();paint.rect(x,y,rw,rh);paint.clip();
   paint.drawImage(image,x+offset(px,rw-iw*k),y+offset(py,rh-ih*k),iw*k,ih*k);paint.restore();
  });
  const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  for(const node of nodes){
   const style=getComputedStyle(node.parentElement);if(!node.textContent.trim())continue;
   paint.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
   paint.letterSpacing=style.letterSpacing==='normal'?'0px':style.letterSpacing;
   paint.fillStyle=style.color;paint.textBaseline='alphabetic';
   // Measure the actual inline baseline, as the headline reveal does. Range.top
   // is the font box, not the baseline, and canvas "top" uses different metrics.
   for(const match of [...node.textContent.matchAll(/\S+/g)].reverse()){
    const range=document.createRange();range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);const r=range.getBoundingClientRect();
    const marker=document.createElement('span');marker.style.cssText='display:inline-block;width:0;height:0;padding:0;margin:0;vertical-align:baseline';
    range.collapse(false);range.insertNode(marker);const baseline=marker.getBoundingClientRect().top;
    const tail=marker.nextSibling;marker.remove();
    // Restore the original text node without replacing application-owned nodes.
    if(tail?.nodeType===Node.TEXT_NODE){node.appendData(tail.data);tail.remove();}
    const text=style.textTransform==='uppercase'?match[0].toUpperCase():style.textTransform==='lowercase'?match[0].toLowerCase():match[0];
    paint.fillText(text,(r.left-rect.left)*sx,(baseline-rect.top)*sy);
   }
  }ready=true;last=-1;
 }
 function set(progress){if(ready&&(element.offsetWidth!==source.width||element.offsetHeight!==source.height)){canvas.style.opacity='0';element.classList.toggle('card-resolving',false);return;}const p=progress>=.995?1:Math.max(0,progress);canvas.style.opacity=String(Math.min(1,(1-p)/.12));element.classList.toggle('card-resolving',p<.88);if(p===1||!ready)return;
 const block=Math.max(1,Math.round(28*(1-p)**2));if(block===last)return;last=block;
 small.width=Math.max(1,Math.ceil(source.width/block));small.height=Math.max(1,Math.ceil(source.height/block));sample.drawImage(source,0,0,small.width,small.height);ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(small,0,0,canvas.width,canvas.height);
 }
 return {prepare,set};
}
export function draggableStrip(strip){
 let pointer=null,start=0,left=0,moved=0;
 strip.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){moved=0;return;}if(e.button!==0)return;pointer=e.pointerId;start=e.clientX;left=strip.scrollLeft;moved=0;});
 strip.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;moved=Math.abs(e.clientX-start);if(moved>6){strip.setPointerCapture(pointer);strip.scrollLeft=left+start-e.clientX;}});
 const release=()=>{pointer=null;};strip.addEventListener('pointerup',release);strip.addEventListener('pointercancel',release);strip.addEventListener('lostpointercapture',release);
 strip.addEventListener('click',e=>{if(moved>6){e.preventDefault();e.stopPropagation();}},{capture:true});
 strip.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();strip.scrollBy({left:e.key==='ArrowLeft'?-290:290,behavior:'smooth'});});
}
