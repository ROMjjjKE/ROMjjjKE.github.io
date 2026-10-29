// Shared, factual site metadata. Project-specific editorial content lives in content/projects.json.
export const SITE = {
 origin:'https://www.garcy.studio', name:'garcy.studio',
 title:'Design that makes you unmistakable — garcy.studio',
 description:'A brand people ask about. A website that makes things click. We design brands, websites and digital products that make your business unmistakable.',
 email:'hello@garcy.studio',
 measurementId:'G-3DXVNT1G04', // Existing verified studio stream; activated only in public builds.
 socials:['https://www.behance.net/thisisgarcy','https://www.instagram.com/garcy.studio/','https://www.linkedin.com/company/garcy-studio/','https://www.youtube.com/@garcystudio'],
};
export {SERVICES} from './content/services.js';
import {PROJECT_NAMES} from './project-registry.js';
export {PROJECT_NAMES};
export function routeMeta(route,projects={}){const slug=route.startsWith('project/')?route.slice(8):null;return slug&&PROJECT_NAMES[slug]?{title:`${PROJECT_NAMES[slug]} — Selected work — garcy.studio`,description:`Explore ${PROJECT_NAMES[slug]}, a selected design project by garcy.studio.`,path:`/projects/${slug}/`,...projects[slug]}:{title:SITE.title,description:SITE.description,path:'/'};}
