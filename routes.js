import {PROJECT_SLUGS} from './project-pages.js';
export const SECTION_ROUTES=['loader','opening','moment','approach','clients','testimonials','projects','studio'];
export function readRoute(hash,pathname='/'){const project=pathname.match(/^\/projects\/([^/]+)\/?$/);if(project&&Object.values(PROJECT_SLUGS).includes(project[1]))return `project/${project[1]}`;const route=hash.replace(/^#\/?/,'');return SECTION_ROUTES.includes(route)||(route.startsWith('project/')&&Object.values(PROJECT_SLUGS).includes(route.slice(8)))?route:'loader';}
