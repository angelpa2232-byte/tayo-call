// Keep SVG placement on outer groups so CSS motion never replaces their transforms.
export const move=(content,x,y,name,sx=0,sy=0,delay=0)=>`<g data-motion="${name}" class="motion-move" style="--mx:${x}px;--my:${y}px;--sx:${sx}px;--sy:${sy}px;animation-delay:${delay}s">${content}</g>`;
export const appear=(content,name,delay=0)=>`<g data-motion="${name}" class="motion-appear" style="animation-delay:${delay}s">${content}</g>`;
export const sway=(content,name)=>`<g data-motion="${name}" class="motion-sway">${content}</g>`;
export const spin=(content,name)=>`<g data-motion="${name}" class="motion-spin">${content}</g>`;
export const wave=(content,name)=>`<g data-motion="${name}" class="motion-wave">${content}</g>`;
