export const MENU_PAGES=[
 {title:'Начало',type:'Страница',href:'/#/opening'},
 {title:'Моменты',type:'Страница',href:'/#/moment'},
 {title:'Работы',type:'Страница',href:'/#/projects'},
 {title:'Подход',type:'Страница',href:'/#/approach'},
 {title:'Студия',type:'Страница',href:'/#/studio'},
 {title:'Обсудить проект',type:'Окно',href:'#contact'}
];
export function searchMenu(items,query='',filter=''){
 const clean=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const terms=clean(query).trim().split(/\s+/).filter(Boolean);
 return items.filter(item=>(!filter||item.type===filter)&&terms.every(term=>clean(item.title+' '+(item.description||'')).includes(term))).map((item,index)=>({item,index,score:terms.reduce((s,t)=>s+(clean(item.title).startsWith(t)?3:clean(item.title).includes(t)?2:0),0)})).sort((a,b)=>b.score-a.score||a.index-b.index).map(x=>x.item);
}
