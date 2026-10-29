import {setupStudioMenu} from './studio-menu.js';
import {setupButtonPixels} from './button-effects.js';
setupStudioMenu({onToggle:open=>{document.documentElement.style.overflow=open?'hidden':'';}});
setupButtonPixels(matchMedia('(prefers-reduced-motion: reduce)'));
