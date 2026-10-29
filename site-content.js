// Shared, factual site metadata. Project-specific editorial content lives in content/projects.json.
export const SITE = {
 origin:'https://romjjjke.github.io', name:'SiteFast.by',
 title:'Сайты и ИИ-агенты, которые приносят клиентов — SiteFast.by',
 description:'Делаем сайты под ключ за 3 дня и внедряем ИИ-агентов: приём заявок и запись 24/7. Бесплатный макет до начала работ.',
 email:'roman@sitefast.by',
 measurementId:'G-3DXVNT1G04', // Existing verified studio stream; activated only in public builds.
 socials:['https://t.me/romjkKe'],
};
export {SERVICES} from './content/services.js';
import {PROJECT_NAMES} from './project-registry.js';
export {PROJECT_NAMES};
export function routeMeta(route,projects={}){const slug=route.startsWith('project/')?route.slice(8):null;return slug&&PROJECT_NAMES[slug]?{title:`${PROJECT_NAMES[slug]} — Работы — SiteFast.by`,description:`Проект ${PROJECT_NAMES[slug]} в портфолио SiteFast.by.`,path:`/projects/${slug}/`,...projects[slug]}:{title:SITE.title,description:SITE.description,path:'/'};}
