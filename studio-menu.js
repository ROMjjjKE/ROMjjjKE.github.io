import {setupContact} from './contact.js';
import {createFloppyStack} from './floppy-stack.js';
import {pixelCard} from './card-effects.js';
import {floppyModel} from './floppy-model.js';
import {menuDisruption,pixelFloppy} from './menu-effects.js';
import {MENU_PAGES,searchMenu} from './menu-search.js';
export function setupStudioMenu({onToggle=()=>{},onNavigate}={}){
 const contactModal=setupContact({onToggle});
 const trigger=document.querySelector('.profile-button');if(!trigger)return;
 const triggers=[...document.querySelectorAll('.profile-button,.search-shortcut')];
 const apple=/Mac|iPhone|iPad|iPod/i.test(navigator.userAgentData?.platform||navigator.platform);
 const shortcut=document.querySelector('.search-shortcut');
 if(shortcut){shortcut.querySelector('.shortcut-command').hidden=!apple;shortcut.querySelector('.shortcut-control').hidden=apple;shortcut.title=`Open studio search (${apple?'⌘':'Ctrl+'}K)`;}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),dialog=document.createElement('dialog');
 dialog.className='studio-menu';dialog.id='studio-menu';dialog.setAttribute('aria-label','Studio search and navigation');
 dialog.innerHTML=`<div class="menu-tv" aria-hidden="true"></div><button class="menu-close" aria-label="Close studio search"><span class="esc-key">esc</span></button>
 <div class="menu-composition"><div class="menu-window"><label class="menu-search-row"><img src="/assets/menu/search.svg" alt=""><input aria-label="Studio search" role="combobox" aria-autocomplete="list" aria-controls="studio-results" aria-expanded="true" autocomplete="off" spellcheck="false" placeholder="Studio search"></label><section class="menu-panel"><div class="menu-filters" aria-label="Search filters"><button data-filter="Project" aria-pressed="false">Our work</button><button data-filter="Service" aria-pressed="false">Services</button></div><div class="menu-results" id="studio-results" role="listbox" aria-label="Suggestions"><div class="menu-selection" aria-hidden="true"></div></div><p class="menu-status" role="status"></p></section></div>
 <div class="menu-floppy"><button class="floppy-grip" aria-label="Drag to rotate floppy">${floppyModel('garcy')}</button><p class="menu-eject">more discs coming soon<span>Drag to rotate</span></p></div></div>
 <section class="menu-disks" aria-label="Choose a studio" hidden><div class="disk-orbit"><a class="studio-disk disk-tesseral" href="https://tesseral.design" aria-label="Visit tesseral.design">${floppyModel('tesseral')}</a></div><button class="menu-return">Back to search</button><p>CHOOSE YOUR DISK</p></section>
 <section class="menu-contact" hidden aria-label="Contact garcy.studio"><h2>Let’s make something unmistakable.</h2><a href="mailto:hello@garcy.studio">hello@garcy.studio ↗</a><button class="menu-contact-back">Back to search</button></section>`;
 document.body.append(dialog);
 // iOS keeps the layout viewport tall when its keyboard covers the page.
 // Position the search against the visible viewport instead.
 function fitKeyboard(){
  const view=window.visualViewport;
  dialog.style.setProperty('--menu-viewport-height',`${view?.height||innerHeight}px`);
  dialog.style.setProperty('--menu-viewport-top',`${view?.offsetTop||0}px`);
  dialog.classList.toggle('keyboard-open',Boolean(view&&innerHeight-view.height>140));
 }
 window.visualViewport?.addEventListener('resize',fitKeyboard);
 window.visualViewport?.addEventListener('scroll',fitKeyboard);
 window.addEventListener('resize',fitKeyboard);

 const floppy=dialog.querySelector('.menu-floppy'),grip=dialog.querySelector('.floppy-grip');dialog.append(floppy);
 const stackController=createFloppyStack(dialog,floppy,reduced);
 const brand=document.querySelector('.site-header>a')?.cloneNode(true);if(brand){brand.className='menu-brand';dialog.append(brand);}
 const disruption=menuDisruption(document.querySelector('.stage'),dialog,reduced),floppyPixels=pixelFloppy(dialog.querySelector('.menu-floppy'),reduced);
 triggers.forEach(button=>{button.disabled=false;button.setAttribute('aria-label','Open studio search');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls',dialog.id);button.setAttribute('aria-expanded','false');button.setAttribute('aria-keyshortcuts',`${apple?'Meta':'Control'}+k`);});
 const input=dialog.querySelector('input'),results=dialog.querySelector('.menu-results'),selection=dialog.querySelector('.menu-selection'),status=dialog.querySelector('.menu-status'),disks=dialog.querySelector('.menu-disks'),contact=dialog.querySelector('.menu-contact');
 let index=[],filter='',active=0,visible=[],timers=[],previousFocus,typing=false;
 const later=(fn,ms)=>{const id=setTimeout(fn,reduced.matches?0:ms);timers.push(id);return id;};
 const clearTimers=()=>{timers.forEach(clearTimeout);timers=[];input.placeholder='Studio search';dialog.classList.remove('is-opening');document.querySelector('.stage')?.classList.remove('menu-disruption');};
 async function load(){try{const response=await fetch('/search-index.json');if(!response.ok)throw Error('Search unavailable');index=await response.json();if(dialog.open)render();}catch{status.textContent='Project and journal search is temporarily unavailable.';}}
 function select(i){active=Math.max(0,Math.min(i,visible.length-1));const rows=[...results.querySelectorAll('.menu-result')];rows.forEach((row,n)=>row.setAttribute('aria-selected',String(n===active)));const row=rows[active];selection.hidden=!row;if(row){selection.style.transform=`translateY(${row.offsetTop}px)`;selection.style.height=`${row.offsetHeight}px`;input.setAttribute('aria-activedescendant',row.id);}else input.removeAttribute('aria-activedescendant');}
 function render(){const query=input.value.trim();const nextTyping=Boolean(query||filter);if(typing!==nextTyping){typing=nextTyping;floppyPixels(typing);}dialog.classList.toggle('is-typing',typing);dialog.querySelector('.menu-floppy').inert=typing;visible=searchMenu(query||filter?[...MENU_PAGES,...index]:MENU_PAGES,query,filter);results.querySelectorAll('.menu-result').forEach(n=>n.remove());for(const [i,item] of visible.entries()){
 const row=document.createElement('a');row.href=item.href;row.className='menu-result';row.id=`studio-result-${i}`;row.setAttribute('role','option');row.tabIndex=-1;
 const label=document.createElement('span');label.className='menu-result-title';label.textContent=item.title;const arrow=document.createElement('img');arrow.src='/assets/menu/arrow.svg';arrow.alt='';label.append(arrow);
 const type=document.createElement('span');type.className='menu-result-type';type.textContent=item.type;const enter=document.createElement('span');enter.className='menu-enter';enter.textContent='Enter';type.append(enter);row.append(label,type);row.addEventListener('pointerenter',()=>select(i));row.addEventListener('click',event=>activate(event,item));results.append(row);
 }status.textContent=visible.length?'': 'No matches. Try another word or filter.';select(0);}
 async function activate(event,item){if(event&&(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey))return;event?.preventDefault();if(dialog.classList.contains('is-navigating'))return;if(item.href==='#contact'){close(true);contactModal.open();return;}dialog.classList.add('is-navigating');const panel=dialog.querySelector('.menu-window');const effect=pixelCard(panel);await effect.prepare();const start=performance.now();let frame;function pixels(now){const p=Math.min(1,(now-start)/900);effect.set(1-p*.95);if(p<1)frame=requestAnimationFrame(pixels);}if(!reduced.matches)frame=requestAnimationFrame(pixels);await panel.animate([{transform:'scale(1)'},{transform:'scale(2.8)'}],{duration:reduced.matches?0:650,easing:'cubic-bezier(.65,0,.25,1)',fill:'forwards'}).finished;const handled=onNavigate?.(item.href);if(!handled){dialog.classList.add('is-leaving-page');cancelAnimationFrame(frame);location.assign(item.href);return;}await dialog.animate([{transform:'translateY(0)',opacity:1},{transform:'translateY(110%)',opacity:0}],{duration:reduced.matches?100:950,easing:'cubic-bezier(.76,0,.24,1)',fill:'forwards'}).finished;cancelAnimationFrame(frame);panel.querySelector('.card-pixels')?.remove();panel.classList.remove('card-resolving');if(handled){close(true);dialog.getAnimations().forEach(a=>a.cancel());panel.getAnimations().forEach(a=>a.cancel());}else location.assign(item.href);}
 let openingAnimation;
 function expandFromButton(){
  openingAnimation?.cancel();
  if(reduced.matches)return;
  const panel=dialog.querySelector('.menu-window');
  const origin=(previousFocus?.matches('.profile-button,.search-shortcut')?previousFocus:shortcut||trigger).getBoundingClientRect();
  const target=panel.getBoundingClientRect();
  openingAnimation=panel.animate([
   {transform:`translate(${origin.x+origin.width/2-target.x-target.width/2}px,${origin.y+origin.height/2-target.y-target.height/2}px) scale(${origin.width/target.width},${origin.height/target.height})`,opacity:.35,borderRadius:'24px'},
   {transform:'translate(0,0) scale(1,1)',opacity:1,borderRadius:'12px'}
  ],{duration:650,easing:'cubic-bezier(.22,1,.36,1)'});
 }
 function open(){if(dialog.open)return;clearTimers();stackController.leave();previousFocus=document.activeElement;input.value='';filter='';dialog.className='studio-menu';dialog.querySelector('.menu-composition').inert=false;disks.hidden=true;contact.hidden=true;floppy.style.setProperty('--pull-y','0px');grip.setAttribute('aria-label','Drag to rotate floppy');dialog.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed','false'));render();dialog.showModal();fitKeyboard();expandFromButton();disruption.play();triggers.forEach(button=>button.setAttribute('aria-expanded','true'));onToggle(true);document.querySelector('.stage')?.classList.add('menu-underlay');dialog.classList.add('is-opening');document.querySelector('.stage')?.classList.add('menu-disruption');input.placeholder='';input.focus();const text='Studio search';for(let i=1;i<=text.length;i++)later(()=>input.placeholder=text.slice(0,i),180+i*45);later(()=>{dialog.classList.remove('is-opening');document.querySelector('.stage')?.classList.remove('menu-disruption');},850);if(!index.length)load();}
 function close(force=false){if(!dialog.open||(dialog.classList.contains('is-navigating')&&force!==true))return;clearTimers();openingAnimation?.cancel();disruption.stop();dialog.close();document.querySelector('.stage')?.classList.remove('menu-disruption');triggers.forEach(button=>button.setAttribute('aria-expanded','false'));document.querySelector('.stage')?.classList.remove('menu-underlay');onToggle(false);previousFocus?.focus({preventScroll:true});}
 function back(){clearTimers();stackController.leave();dialog.querySelector('.menu-composition').inert=false;dialog.classList.remove('is-ejected','is-contact');disks.hidden=true;contact.hidden=true;grip.setAttribute('aria-label','Drag to rotate floppy');input.focus();}
 dialog.addEventListener('keydown',event=>event.stopPropagation());
 triggers.forEach(button=>button.addEventListener('click',open));dialog.querySelector('.menu-close').addEventListener('click',close);dialog.addEventListener('cancel',event=>{event.preventDefault();close();});input.addEventListener('input',render);
 dialog.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=filter===button.dataset.filter?'':button.dataset.filter;dialog.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));render();input.focus();}));
 function eject(){if(dialog.classList.contains('is-ejected'))return;clearTimers();floppy.style.setProperty('--pull-y','0px');dialog.classList.add('is-ejected');dialog.querySelector('.menu-composition').inert=true;disks.hidden=false;stackController.enter();grip.setAttribute('aria-label','Return to studio search');later(()=>grip.focus({preventScroll:true}),850);}
 dialog.querySelector('.menu-return').addEventListener('click',back);dialog.querySelector('.menu-contact-back').addEventListener('click',back);
 let drag=null,rx=0,ry=0;
 function rotate(){grip.style.transform=`rotateX(${rx}deg) rotateY(${ry}deg)`;}
 grip.addEventListener('pointerdown',event=>{if(event.button!==0)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY,rx,ry};grip.setPointerCapture(event.pointerId);floppy.classList.add('is-dragging');});
 grip.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;rx=Math.max(-65,Math.min(65,drag.rx-(event.clientY-drag.y)*.3));ry=drag.ry+(event.clientX-drag.x)*.4;rotate();});
 function release(){drag=null;floppy.classList.remove('is-dragging');}
 grip.addEventListener('pointerup',release);grip.addEventListener('pointercancel',release);
 // Keep browser shortcuts intact while another modal or the loading screen is active.
 window.addEventListener('keydown',event=>{
  if(event.key.toLowerCase()!=='k'||event.altKey||event.shiftKey||!(apple?event.metaKey&&!event.ctrlKey:event.ctrlKey&&!event.metaKey))return;
  if(!dialog.open&&(trigger.disabled||trigger.closest('[inert]')||document.querySelector('dialog[open]')))return;
  event.preventDefault();event.stopImmediatePropagation();if(event.repeat)return;
  if(dialog.open)close();else open();
 },{capture:true});
 // Capture scene shortcuts/gestures so the screen behind the dialog stays in place.
 for(const type of ['wheel','touchstart','touchmove','touchend','keydown'])window.addEventListener(type,event=>{if(!dialog.open)return;if(type==='keydown'){
 if(event.key==='Escape'){event.preventDefault();close();}
 else if(!dialog.classList.contains('is-ejected')&&!dialog.classList.contains('is-contact')&&['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();select((active+(event.key==='ArrowDown'?1:-1)+visible.length)%Math.max(1,visible.length));results.querySelector(`#studio-result-${active}`)?.scrollIntoView({block:'nearest'});}
 else if(event.key==='Enter'&&event.target===input&&visible[active]){event.preventDefault();results.querySelector(`#studio-result-${active}`).click();}
 }if(type!=='keydown'||!['Tab','Enter',' '].includes(event.key)||event.target===input)event.stopImmediatePropagation();},{capture:true,passive:false});
 return {open,close,openContact:contactModal.open};
}
