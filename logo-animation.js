import animationData from './assets/loader/logo-motion.js';
let renderer;
function loadRenderer(){return renderer??=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='./assets/vendor/lottie-svg-5.13.0.min.js';script.onload=()=>resolve(window.lottie);script.onerror=reject;document.head.append(script);});}
export async function animateEntryLogo(container,reduced){
 const lottie=await loadRenderer();container.replaceChildren();
 const animation=lottie.loadAnimation({container,renderer:'svg',loop:false,autoplay:false,animationData:structuredClone(animationData),rendererSettings:{preserveAspectRatio:'xMidYMid meet',progressiveLoad:false}});
 await new Promise((resolve,reject)=>{animation.addEventListener('DOMLoaded',resolve);animation.addEventListener('data_failed',reject);});
 animation.goToAndStop(75,true);
 const svg=container.querySelector('svg'),art=svg.querySelector('g');
 const bounds=art.getBBox();
 svg.setAttribute('viewBox',`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`);svg.style.overflow='visible';
 container.style.aspectRatio=`${bounds.width} / ${bounds.height}`;
 // Keep the original bottom dot inside the stage while retaining every authored keyframe.
 const position=()=>{const box=art.getBBox(),overflow=Math.max(0,box.y+box.height-bounds.y-bounds.height);svg.style.translate=`0 ${-overflow*container.clientWidth/bounds.width}px`;};
 animation.addEventListener('enterFrame',position);
 if(reduced){position();return ()=>animation.destroy();}
 animation.goToAndStop(0,true);position();
 await new Promise(resolve=>{animation.addEventListener('complete',resolve);animation.play();});
 const stopHover=await pixelLogoHover(container,svg);
 return ()=>{stopHover();animation.destroy();};
}

// Rasterize the completed authored SVG once; never substitute a different logo.
async function pixelLogoHover(container,svg){
 const clone=svg.cloneNode(true),box=svg.viewBox.baseVal;
 clone.setAttribute('width',Math.ceil(box.width));clone.setAttribute('height',Math.ceil(box.height));
 clone.style.cssText='';
 const image=new Image(),url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml'}));
 try{image.src=url;await image.decode();}catch{URL.revokeObjectURL(url);return ()=>{};}
 URL.revokeObjectURL(url);
 const canvas=document.createElement('canvas'),small=document.createElement('canvas');
 canvas.className='entry-logo-pixels';canvas.setAttribute('aria-hidden','true');canvas.hidden=true;container.append(canvas);
 const ctx=canvas.getContext('2d'),sample=small.getContext('2d');let frame,value=0;
 function draw(){
  const ratio=Math.min(devicePixelRatio,2);canvas.width=Math.ceil(container.clientWidth*ratio);canvas.height=Math.ceil(container.clientHeight*ratio);
  const block=1+value*14;
  small.width=Math.max(1,Math.round(canvas.width/block));small.height=Math.max(1,Math.round(canvas.height/block));
  sample.drawImage(image,0,0,small.width,small.height);ctx.imageSmoothingEnabled=false;ctx.drawImage(small,0,0,canvas.width,canvas.height);
 }
 function animate(target){
  cancelAnimationFrame(frame);const from=value,start=performance.now();canvas.hidden=false;svg.style.opacity='0';
  function tick(now){const p=Math.min(1,(now-start)/(target?420:950));value=from+(target-from)*(1-(1-p)**3);draw();
   if(p<1)frame=requestAnimationFrame(tick);else if(!target){canvas.hidden=true;svg.style.opacity='';}}
  frame=requestAnimationFrame(tick);
 }
 const enter=event=>{if(event.pointerType==='mouse')animate(1);},leave=()=>animate(0);
 container.addEventListener('pointerenter',enter);container.addEventListener('pointerleave',leave);
 return ()=>{cancelAnimationFrame(frame);container.removeEventListener('pointerenter',enter);container.removeEventListener('pointerleave',leave);canvas.remove();svg.style.opacity='';};
}
