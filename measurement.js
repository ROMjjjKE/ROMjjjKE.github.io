import {measurementEvent} from './measurement-events.js';
// No third-party requests without configuration AND explicit visitor consent.
// Production deployments also have Vercel aliases: never measure preview visitors.
const config=location.hostname==='www.garcy.studio'?document.querySelector('meta[name="ga-measurement-id"]')?.content:undefined;
let enabled=false,lastPage,currentPage={page:location.pathname,section:'entry'};
function source(){try{const host=new URL(document.referrer).hostname;return /(^|\.)(chatgpt\.com|chat\.openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com)$/.test(host)?'ai-referral':host?'referral':'direct';}catch{return 'direct';}}
const acquisition=source();
export function track(event,fields={}){
 const detail=measurementEvent(event,fields,{origin:location.origin,pathname:location.pathname,title:document.title,source:acquisition});
 if(!detail)return;
 if(event==='page_view'){
  currentPage={page:detail.page,section:detail.section};
  const key=detail.page+'|'+detail.section;if(lastPage===key)return;lastPage=key;
 }
 document.dispatchEvent(new CustomEvent('studio:measurement',{detail:{event,...detail}}));
 if(enabled)window.gtag('event',event,detail);
}
function activate(){
 if(enabled||!/^G-[A-Z0-9]+$/.test(config||''))return;
 enabled=true;window['ga-disable-'+config]=false;
 window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments);};
 window.gtag('consent','update',{analytics_storage:'granted'});
 if(!document.querySelector('[data-studio-analytics]')){
  window.gtag('js',new Date());
  let referrer='';try{referrer=new URL(document.referrer).origin;}catch{}
  // Manual routing owns page views; disable GA's automatic history-change views
  // in the stream as well to prevent duplicate reporting.
  window.gtag('config',config,{send_page_view:false,page_referrer:referrer,...(new URLSearchParams(location.search).has('diagnostics')?{debug_mode:true}:{})});
  const script=document.createElement('script');script.async=true;script.dataset.studioAnalytics='';script.src=`https://www.googletagmanager.com/gtag/js?id=${config}`;document.head.append(script);
 }
 if(lastPage!==undefined){lastPage=undefined;track('page_view',currentPage);}
}
export function chooseAnalytics(choice){
 try{localStorage.setItem('studio-analytics-consent',choice);}catch{}
 if(choice==='yes')activate();
 else {enabled=false;window['ga-disable-'+config]=true;window.gtag?.('consent','update',{analytics_storage:'denied'});}
}
export function showAnalyticsPreference(){
 if(document.querySelector('[data-analytics-preference]'))return;
 if(!document.querySelector('[data-consent-style]')){const css=document.createElement('link');css.rel='stylesheet';css.href='/consent.css';css.dataset.consentStyle='';document.head.append(css);}
 const aside=document.createElement('aside');aside.dataset.analyticsPreference='';aside.className='analytics-glass';aside.setAttribute('aria-label','Analytics preference');
 aside.innerHTML='<p class="analytics-copy" title="Allow Google Analytics to help us improve the website?">Analytics to improve our site?</p><div class="analytics-actions"><button type="button" data-choice="no">No thanks</button><button type="button" data-choice="yes" aria-label="Allow Google Analytics">Allow</button></div>';
 aside.addEventListener('click',e=>{const choice=e.target.dataset.choice;if(!choice)return;chooseAnalytics(choice);aside.remove();});document.body.append(aside);
}
if(config){
 let consent;try{consent=localStorage.getItem('studio-analytics-consent');}catch{}
 const intro=document.querySelector('.entry-actions');
 const atIntro=intro&&location.pathname==='/'&&(!location.hash||location.hash==='#/loader'||location.hash==='#loader');
 if(consent==='yes')activate();else if(consent!=='no'&&!atIntro)showAnalyticsPreference();
}
document.addEventListener('click',e=>{
 if(e.target.closest('[data-analytics-settings]')){e.preventDefault();showAnalyticsPreference();}
 if(e.target.closest('a[href^="mailto:"]'))track('contact_click',{page:location.pathname});
 const play=e.target.closest('[data-testimonial]');if(play)track('testimonial_play',{person:play.dataset.testimonial,page:location.pathname});
});
// Google's pinned measurement implementation handles page lifecycle and interaction percentiles.
async function measureVitals(){
 const {onLCP,onINP,onCLS}=await import('/assets/vendor/web-vitals-6.2.2.js');
 const report=metric=>{document.documentElement.dataset[metric.name.toLowerCase()]=String(metric.value);track('web_vital',{name:metric.name,value:metric.value,page:location.pathname});};
 onLCP(report,{reportAllChanges:true});onINP(report,{reportAllChanges:true});onCLS(report,{reportAllChanges:true});
}
if(document.readyState==='complete')measureVitals();else window.addEventListener('load',measureVitals,{once:true});
let longTasks=0;
try{new PerformanceObserver(list=>{longTasks+=list.getEntries().length;document.documentElement.dataset.longTasks=String(longTasks);}).observe({type:'longtask',buffered:true});}catch{}
// Scene routes report during startup. Content/loader pages receive one fallback view.
const initialView=()=>{if(lastPage===undefined)track('page_view',{page:location.pathname,section:document.querySelector('.entry')?'loader':'content'});};
if(document.readyState==='complete')initialView();else window.addEventListener('load',initialView,{once:true});

setTimeout(()=>{const resources=performance.getEntriesByType('resource');document.documentElement.dataset.transferBytes=String(resources.reduce((total,r)=>total+r.transferSize,0));document.documentElement.dataset.requestCount=String(resources.length);if(new URLSearchParams(location.search).has('diagnostics'))document.documentElement.dataset.resourceReport=JSON.stringify(resources.filter(r=>r.transferSize>50000).map(r=>({asset:r.name.split('/').pop().split('?')[0],bytes:r.transferSize})).sort((a,b)=>b.bytes-a.bytes));},5000);
