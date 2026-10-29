import {track} from './measurement.js';
import {setupButtonPixels} from './button-effects.js';
import {SERVICES} from './content/services.js';
import {menuDisruption} from './menu-effects.js';
export function setupContact({onToggle=()=>{}}={}){
 const dialog=document.createElement('dialog');dialog.className='contact-modal studio-menu';dialog.setAttribute('aria-label','Start a project');
 dialog.innerHTML='<div class="menu-tv" aria-hidden="true"></div><button class="menu-close" aria-label="Close contact form"><span class="esc-key">esc</span></button><form class="contact-window menu-window" novalidate></form>';document.body.append(dialog);
 const sheet=dialog.querySelector('form'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const disruption=menuDisruption(document.querySelector('.stage'),dialog,reduced);
 let openingTimer, transitioning=false;
 let step=1,serviceIndex=0,budget=1,busy=false,previous,values={name:'',email:'',note:''},submissionId,animation=0;
 const budgets=['$9k–$14k','$14k–$22k','$22k–$50k'];
 const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const intro='<p class="contact-intro">You’ve got something that matters. We’re here to take it further — with care, clarity, and the kind of outcome that makes you smile in disbelief. Tell us what’s on your mind, and we’ll get back within 24 hours.<br><br><strong>Let’s make it happen.</strong></p>';
 const action=label=>`<button class="contact-next" type="submit">${label}<img src="/assets/contact/arrow.svg" alt=""><span class="contact-enter">Enter</span></button>`;
 async function render(){
  if(transitioning)return;
  const morph=sheet.childElementCount>0&&dialog.open&&!reduced.matches;
  const oldHeight=sheet.getBoundingClientRect().height;
  if(morph){
   transitioning=true;sheet.inert=true;
   await sheet.animate([{opacity:1},{opacity:0,translate:'0 -8px'}],{duration:140,easing:'ease-in',fill:'forwards'}).finished;
  }
  sheet.getAnimations().forEach(a=>a.cancel());
  cancelAnimationFrame(animation);sheet.querySelector('.card-pixels')?.remove();sheet.classList.remove('card-resolving');
  sheet.innerHTML=(step>1&&step<5?'<button class="contact-back" type="button"><img src="/assets/contact/back.svg" alt="">Back</button>':'')+(step===1?`${intro}<div class="contact-label">Start with your details <span>* Mandatory, thanks</span></div><div class="contact-fields"><label class="contact-field"><img src="/assets/contact/person.svg" alt=""><input placeholder="Your name*" name="name" aria-label="Name" autocomplete="given-name" required maxlength="100" value="${escape(values.name)}"></label><label class="contact-field"><img src="/assets/contact/email.svg" alt=""><input placeholder="Your email*" name="email" aria-label="Email" type="email" autocomplete="email" required maxlength="254" value="${escape(values.email)}"></label></div><div class="contact-actions"><a href="https://garcy.studio/calendar" target="_blank" rel="noopener">Book a call<img src="/assets/contact/calendar.svg" alt=""></a>${action('Continue')}</div>`:step===2?`<h2>${escape(values.name)}, what are you interested in?</h2><div class="contact-services" role="group" aria-label="Select a service"><div class="menu-selection" aria-hidden="true"></div>${SERVICES.map((s,i)=>`<button type="button" class="menu-result" data-service="${i}" aria-pressed="${i===serviceIndex}" aria-selected="${i===serviceIndex}"><span class="menu-result-title">${escape(s.title)}<img src="/assets/contact/arrow.svg" alt=""></span><span class="menu-result-type">Service<span class="menu-enter">Enter</span></span></button>`).join('')}</div>`:step===3?`<h2>${escape(values.name)}, what’s your budget for ${escape(SERVICES[serviceIndex].title)}?</h2><div class="budget-control" style="--budget:${budget}"><button class="budget-selection" type="submit" aria-label="Continue with ${budgets[budget]}"><span class="budget-price">${budgets[budget]}</span><span class="contact-enter">Enter</span></button><input name="budget" aria-label="Project budget" type="range" min="0" max="2" step="1" value="${budget}" aria-valuetext="${budgets[budget]}"></div><div class="budget-labels" aria-hidden="true"><span>$9,000</span><span>$14,000</span><span>$22,000</span><span>$50,000</span></div>`:step===4?`${intro}<label class="contact-label" for="project-note">Describe your project <span>Optional</span></label><textarea id="project-note" name="note" aria-label="Describe your project" maxlength="10000" placeholder="What do you have in mind?">${escape(values.note)}</textarea><input class="contact-trap" name="contact_website_check" tabindex="-1" autocomplete="off" data-1p-ignore data-lpignore="true" aria-hidden="true"><p class="contact-error" role="alert"></p><div class="contact-actions"><span></span>${action('Send and Smile')}</div>`:`<div class="contact-success" role="status"><span class="success-mark" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none"><path d="M13 33 26 45 51 18" stroke="#dadada" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><canvas width="64" height="64"></canvas></span><p>Thank you! Your journey starts now.<br>Check your inbox in the next 24 hours. We’re excited to help bring your vision to life!</p><p class="success-closing">Let’s make it happen.</p></div>`);
  sheet.dataset.step=step;
  sheet.querySelector('.contact-back')?.addEventListener('click',()=>{save();step--;render();});
  sheet.querySelectorAll('[data-service]').forEach(b=>{
   b.addEventListener('click',()=>{serviceIndex=Number(b.dataset.service);step=3;render();});
   b.addEventListener('pointerenter',()=>selectService(Number(b.dataset.service)));
   b.addEventListener('focus',()=>selectService(Number(b.dataset.service)));
  });
  if(step===2)selectService(serviceIndex);
  sheet.querySelector('[name=budget]')?.addEventListener('input',e=>{budget=Number(e.target.value);sheet.querySelector('.budget-control').style.setProperty('--budget',budget);sheet.querySelector('.budget-price').textContent=budgets[budget];sheet.querySelector('.budget-selection').setAttribute('aria-label','Continue with '+budgets[budget]);e.target.setAttribute('aria-valuetext',budgets[budget]);});
  const pill=sheet.querySelector('.budget-selection'),range=sheet.querySelector('[name=budget]');
  if(pill){
   let startX=0,dragged=false,down=false;
   pill.addEventListener('pointerdown',e=>{startX=e.clientX;dragged=false;down=true;pill.setPointerCapture(e.pointerId);});
   pill.addEventListener('pointermove',e=>{
    if(!down)return;
    if(Math.abs(e.clientX-startX)>6)dragged=true;
    if(!dragged)return;
    const box=pill.parentElement.getBoundingClientRect(),width=pill.offsetWidth;
    range.value=Math.max(0,Math.min(2,Math.round((e.clientX-box.left-width/2)/(box.width-width)*2)));
    range.dispatchEvent(new Event('input',{bubbles:true}));
   });
   pill.addEventListener('pointerup',()=>{down=false;});
   pill.addEventListener('pointercancel',()=>{down=false;dragged=true;});
   pill.addEventListener('click',e=>{if(dragged){e.preventDefault();dragged=false;}});
  }
  sheet.querySelectorAll('input').forEach(i=>i.addEventListener('input',validate));validate();setupButtonPixels(reduced);
  const target=sheet.querySelector(step===2?`[data-service="${serviceIndex}"]`:'input:not(.contact-trap),textarea');target?.focus({preventScroll:true});
  if(morph){
   const newHeight=sheet.getBoundingClientRect().height;
   await sheet.animate([{height:oldHeight+'px',opacity:0,translate:'0 8px'},{height:newHeight+'px',opacity:1,translate:'0 0'}],{duration:360,easing:'cubic-bezier(.22,1,.36,1)'}).finished;
  }
  sheet.inert=false;transitioning=false;
  target?.focus({preventScroll:true});
  if(step===5)animateCheck();
 }
 function selectService(index){
  serviceIndex=index;
  const rows=[...sheet.querySelectorAll('[data-service]')],selection=sheet.querySelector('.contact-services .menu-selection');
  rows.forEach((row,i)=>{row.setAttribute('aria-selected',String(i===index));row.setAttribute('aria-pressed',String(i===index));});
  const row=rows[index];if(row&&selection){selection.style.transform=`translateY(${row.offsetTop}px)`;selection.style.height=row.offsetHeight+'px';}
 }
 function animateCheck(){const mark=sheet.querySelector('.success-mark'),canvas=mark.querySelector('canvas'),source=document.createElement('canvas'),small=document.createElement('canvas');source.width=source.height=64;const ink=source.getContext('2d'),paint=canvas.getContext('2d');ink.strokeStyle='#dadada';ink.lineWidth=3;ink.lineCap='round';ink.lineJoin='round';ink.beginPath();ink.moveTo(13,33);ink.lineTo(26,45);ink.lineTo(51,18);ink.stroke();const start=performance.now();function tick(now){const p=reduced.matches?1:Math.min(1,(now-start)/850),cells=Math.round(5+59*p*p);small.width=small.height=cells;small.getContext('2d').drawImage(source,0,0,cells,cells);paint.clearRect(0,0,64,64);paint.imageSmoothingEnabled=false;paint.globalAlpha=Math.min(1,p*4);paint.drawImage(small,0,0,64,64);if(p<1)animation=requestAnimationFrame(tick);else mark.classList.add('is-resolved');}animation=requestAnimationFrame(tick);}
 function save(){for(const key of ['name','email','note']){const el=sheet.elements.namedItem(key);if(el)values[key]=el.value.trim();}}
 function validate(){if(step===1){const email=sheet.elements.email;email.setCustomValidity(!email.value||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())?'':'Enter a complete email address, such as name@company.com.');sheet.querySelector('[type=submit]').disabled=!sheet.elements.name.value.trim()||!sheet.elements.email.validity.valid||!sheet.elements.email.value;}}
 async function advance(){if(busy||transitioning)return;save();if(step===1){validate();if(sheet.querySelector('[type=submit]').disabled)return;step=2;render();}else if(step===2){step=3;render();}else if(step===3){step=4;render();}else if(step===4){busy=true;const button=sheet.querySelector('[type=submit]');button.disabled=true;sheet.setAttribute('aria-busy','true');try{const response=await fetch('/api/contact/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...values,service:SERVICES[serviceIndex].path,budget:budgets[budget],website:sheet.elements.contact_website_check.value,id:submissionId}),signal:AbortSignal.timeout(20000)});if(!response.ok){
 const failure=await response.json().catch(()=>({}));
 const error=new Error(response.status===429?'Too many attempts. Please wait 10 minutes, or email hello@garcy.studio.':failure.error||'Your message could not be sent. Please try again, or email hello@garcy.studio.');
 error.field=failure.field;throw error;
 }track('generate_lead',{service:SERVICES[serviceIndex].path});step=5;await render();}catch(error){const message=sheet.querySelector('.contact-error');message.textContent=error.message;button.disabled=false;
 const correctionStep={name:1,email:1,service:2,budget:3}[error.field];
 if(correctionStep){const edit=document.createElement('button');edit.type='button';edit.className='contact-back';edit.textContent='Edit '+error.field;edit.addEventListener('click',()=>{save();step=correctionStep;render();});message.append(document.createElement('br'),edit);}}finally{busy=false;sheet.removeAttribute('aria-busy');}}}
 sheet.addEventListener('submit',e=>{e.preventDefault();advance();});
 dialog.addEventListener('keydown',e=>{e.stopPropagation();if(step===2&&['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();serviceIndex=(serviceIndex+(e.key==='ArrowDown'?1:-1)+SERVICES.length)%SERVICES.length;selectService(serviceIndex);sheet.querySelector(`[data-service="${serviceIndex}"]`).focus();}else if(e.key==='Enter'&&e.target.tagName!=='TEXTAREA'&&e.target.tagName!=='BUTTON'&&e.target.tagName!=='A'){e.preventDefault();advance();}});
 function fit(){const v=visualViewport;dialog.style.setProperty('--contact-top',`${v?.offsetTop||0}px`);dialog.style.setProperty('--contact-height',`${v?.height||innerHeight}px`);}
 visualViewport?.addEventListener('resize',fit);visualViewport?.addEventListener('scroll',fit);
 function open(){if(dialog.open)return;track('contact_click');previous=document.activeElement;if(step===5){step=1;values={name:'',email:'',note:''};}submissionId=crypto.randomUUID();dialog.showModal();onToggle(true);document.querySelector('.stage')?.classList.add('menu-underlay');fit();render();disruption.play();dialog.classList.add('is-opening');document.querySelector('.stage')?.classList.add('menu-disruption');clearTimeout(openingTimer);openingTimer=setTimeout(()=>{dialog.classList.remove('is-opening');document.querySelector('.stage')?.classList.remove('menu-disruption');},reduced.matches?0:850);}
 function close(){if(busy)return;save();clearTimeout(openingTimer);cancelAnimationFrame(animation);disruption.stop();dialog.classList.remove('is-opening');document.querySelector('.stage')?.classList.remove('menu-disruption');dialog.close();onToggle(false);document.querySelector('.stage')?.classList.remove('menu-underlay');previous?.focus({preventScroll:true});}
 let outside=false;dialog.addEventListener('pointerdown',e=>{outside=e.target===dialog;});dialog.addEventListener('click',e=>{if(outside&&e.target===dialog)close();outside=false;});
 dialog.querySelector('.menu-close').addEventListener('click',close);dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 document.querySelectorAll('.contact,[data-contact]').forEach(b=>{b.disabled=false;if(b.classList.contains('contact'))b.setAttribute('aria-label','Contact garcy.studio');b.addEventListener('click',e=>{e.preventDefault();open();});});
 return {open,close};
}
