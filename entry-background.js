// A slowly changing mosaic, with randomized refinement/coarsening over the original still image.
export function animateEntryBackground(image,canvas,stage,reduced){
 const context=canvas.getContext('2d',{willReadFrequently:true});
 const bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
 let frame,stopped=false,previous=0,changed=0,from=0,target=.45,amount=0,duration=2600;
 canvas.classList.add('ambient-dither');
 function tick(now){
  if(stopped)return;
  if(!document.hidden && !reduced.matches && image.complete && image.naturalWidth>0 && now-previous>65){
   previous=now;
   if(!changed)changed=now;
   let p=Math.min(1,(now-changed)/duration),e=p*p*(3-2*p);amount=from+(target-from)*e;
   if(p===1){from=amount;target=target>.3?.12+Math.random()*.08:.36+Math.random()*.14;changed=now;duration=1800+Math.random()*3400;}
   if(amount<.035){canvas.style.opacity='0';}else{
    const block=Math.max(2,Math.round(2+amount*10));canvas.width=Math.ceil(Math.min(stage.clientWidth,1440)/block);canvas.height=Math.ceil(canvas.width*stage.clientHeight/stage.clientWidth);
    const k=Math.max(canvas.width/image.naturalWidth,canvas.height/image.naturalHeight),focal=parseFloat(getComputedStyle(stage).getPropertyValue('--opening-position'))/100;context.drawImage(image,(canvas.width-image.naturalWidth*k)*focal,(canvas.height-image.naturalHeight*k)/2,image.naturalWidth*k,image.naturalHeight*k);
    const pixels=context.getImageData(0,0,canvas.width,canvas.height),levels=Math.max(1,Math.round(18*(1-amount)**2)),mono=levels<=2?1:Math.max(0,(amount-.65)/.35);
    for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const i=(y*canvas.width+x)*4,t=(bayer[(y%4)*4+x%4]+.5)/16-.5,gray=pixels.data[i]*.2126+pixels.data[i+1]*.7152+pixels.data[i+2]*.0722;for(let c=0;c<3;c++){const v=(pixels.data[i+c]*(1-mono)+gray*mono);pixels.data[i+c]=Math.max(0,Math.min(255,Math.round(v/255*levels+t)/levels*255));}}
    context.putImageData(pixels,0,0);canvas.style.opacity=String(Math.min(1,amount*5));
   }
  }
  frame=requestAnimationFrame(tick);
 }
 function visibility(){cancelAnimationFrame(frame);if(document.hidden || reduced.matches || stage.dataset.motionPaused==='true'){canvas.style.opacity='0';}else if(!stopped){previous=performance.now();frame=requestAnimationFrame(tick);}}
 document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',visibility);stage.addEventListener('motionchange',visibility);visibility();
 return ()=>{stopped=true;cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',visibility);stage.removeEventListener('motionchange',visibility);canvas.classList.remove('ambient-dither');};
}
