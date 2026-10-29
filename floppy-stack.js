export function createFloppyStack(dialog,floppy,reduced){
 const orbit=dialog.querySelector('.disk-orbit'),tesseral=orbit.querySelector('.disk-tesseral');let rotation={x:-16,y:-45},drag=null,blockClick=false,flight,keyboard=false;
 const pose=()=>{orbit.style.setProperty('--stack-x',rotation.x+'deg');orbit.style.setProperty('--stack-y',rotation.y+'deg');};pose();
 function enter(){const before=floppy.getBoundingClientRect();flight?.cancel();floppy.classList.add('in-stack');orbit.prepend(floppy);const after=floppy.getBoundingClientRect();dialog.classList.remove('tesseral-front');if(!reduced.matches)flight=floppy.animate([{translate:`${before.x+before.width/2-after.x-after.width/2}px ${before.y+before.height/2-after.y-after.height/2}px`,rotate:'y 38deg'},{translate:'0 0',rotate:'y 0deg'}],{duration:1000,easing:'cubic-bezier(.22,1,.36,1)'});}
 function leave(){flight?.cancel();for(const d of [floppy,tesseral])d.classList.remove('is-lifted');dialog.append(floppy);floppy.classList.remove('in-stack');dialog.classList.remove('stack-dragging','tesseral-front');drag=null;rotation={x:-16,y:-45};pose();}
 const disks=[floppy,tesseral];
 dialog.addEventListener('pointerdown',()=>keyboard=false,true);
 dialog.addEventListener('keydown',e=>{if(e.key==='Tab')keyboard=true;},true);
 const lift=disk=>{if(drag)return;for(const item of disks)item.classList.toggle('is-lifted',item===disk);};
 for(const disk of disks){
  disk.draggable=false;
  disk.addEventListener('pointerenter',()=>lift(disk));
  disk.addEventListener('focusin',e=>{if(keyboard&&e.target.matches(':focus-visible'))lift(disk);});
 }
 orbit.addEventListener('dragstart',e=>e.preventDefault());
 orbit.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,rx:rotation.x,ry:rotation.y,moved:false};blockClick=false;});
 orbit.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<6)return;drag.moved=true;orbit.setPointerCapture(e.pointerId);dialog.classList.add('stack-dragging');rotation={x:Math.max(-55,Math.min(35,drag.rx-dy*.28)),y:drag.ry+dx*.35};pose();});
 const release=e=>{if(!drag||e.pointerId!==drag.id)return;blockClick=drag.moved;drag=null;dialog.classList.remove('stack-dragging');};
 orbit.addEventListener('pointerup',release);orbit.addEventListener('pointercancel',release);orbit.addEventListener('lostpointercapture',release);
 orbit.addEventListener('click',e=>{if(blockClick){e.preventDefault();e.stopImmediatePropagation();blockClick=false;}},true);
 return {enter,leave};
}
