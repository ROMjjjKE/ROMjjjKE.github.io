// Keep analytics payloads explicit and free of form contents or URL parameters.
const events=new Set(['page_view','contact_click','generate_lead','testimonial_play','web_vital']);
export function measurementEvent(event,fields,{origin,pathname,title,source}){
 if(!events.has(event))return null;
 const page=typeof fields.page==='string'&&/^\/(?!\/)/.test(fields.page)?fields.page.split(/[?#]/)[0]:pathname;
 const detail={source,page};
 for(const key of ['section','name','person','service'])if(typeof fields[key]==='string')detail[key]=fields[key].slice(0,100);
 if(Number.isFinite(fields.value))detail.value=fields.value;
 if(event==='page_view')Object.assign(detail,{page_location:origin+page,page_title:title});
 return detail;
}
