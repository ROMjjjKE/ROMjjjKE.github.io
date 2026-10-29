export const MENU_PAGES=[
 {title:'Intro',type:'Page',href:'/#/opening'},
 {title:'Moments',type:'Page',href:'/#/moment'},
 {title:'Our work',type:'Page',href:'/#/projects'},
 {title:'The difference',type:'Page',href:'/#/approach'},
 {title:'The studio',type:'Page',href:'/#/studio'},
 {title:'Let’s talk',type:'Window',href:'#contact'}
];
export function searchMenu(items,query='',filter=''){
 const clean=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const terms=clean(query).trim().split(/\s+/).filter(Boolean);
 return items.filter(item=>(!filter||item.type===filter)&&terms.every(term=>clean(item.title+' '+(item.description||'')).includes(term))).map((item,index)=>({item,index,score:terms.reduce((s,t)=>s+(clean(item.title).startsWith(t)?3:clean(item.title).includes(t)?2:0),0)})).sort((a,b)=>b.score-a.score||a.index-b.index).map(x=>x.item);
}
