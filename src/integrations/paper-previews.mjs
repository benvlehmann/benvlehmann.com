// After the build, give every page that links to arXiv papers in the preview
// index a small JSON block with just those papers, plus the ~1.5 KB script that
// shows a preview card on hover/focus. Pages without such links are untouched.
import { readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ARXIV = /href="https?:\/\/arxiv\.org\/abs\/([^"?#]+?)(?:v\d+)?"/g;

// Client behaviour: 300 ms hover delay, grace period to move into the card,
// keyboard focus support, Esc to close, no previews on touch-only devices.
const CLIENT = `(()=>{const d=document.getElementById('paper-previews');if(!d||matchMedia('(hover: none)').matches)return;
const idx=JSON.parse(d.textContent),re=/arxiv\\.org\\/abs\\/([^?#]+?)(?:v\\d+)?$/,sel='a[href*="arxiv.org/abs/"]';
let card,timer,hideT,cur,pending;
const key=a=>{const m=a.href.match(re);return m&&idx[m[1]]?m[1]:null};
document.querySelectorAll(sel).forEach(a=>{if(key(a)&&a.title){a.dataset.title=a.title;a.removeAttribute('title')}});
function make(){card=document.createElement('div');card.className='paper-card';card.id='paper-card';card.setAttribute('role','tooltip');card.hidden=true;document.body.appendChild(card);
card.addEventListener('mouseenter',()=>clearTimeout(hideT));card.addEventListener('mouseleave',hide)}
function place(a){const r=a.getBoundingClientRect(),w=card.offsetWidth,h=card.offsetHeight,m=8;
let x=Math.min(Math.max(m,r.left),innerWidth-w-m),y=r.bottom+m;if(y+h>innerHeight-m&&r.top-h-m>m)y=r.top-h-m;
card.style.left=x+scrollX+'px';card.style.top=y+scrollY+'px'}
function show(a){const k=key(a);if(!k)return;if(!card)make();const p=idx[k];
card.innerHTML='<p class="pc-meta">arXiv:'+k+(p.y?' · '+p.y:'')+'</p><p class="pc-title">'+p.t+'</p>'+(p.d?'<p class="pc-desc">'+p.d+'</p>':'');
card.hidden=false;cur=a;a.setAttribute('aria-describedby','paper-card');place(a)}
function close(){clearTimeout(timer);pending=null;if(card)card.hidden=true;if(cur)cur.removeAttribute('aria-describedby');cur=null}
function hide(){clearTimeout(timer);pending=null;clearTimeout(hideT);hideT=setTimeout(close,150)}
const link=e=>e.target.closest&&e.target.closest(sel);
document.addEventListener('mouseover',e=>{const a=link(e);if(!a||!key(a))return;clearTimeout(hideT);if(a===cur||a===pending)return;
clearTimeout(timer);pending=a;timer=setTimeout(()=>{pending=null;show(a)},300)});
document.addEventListener('mouseout',e=>{const a=link(e);if(a&&!a.contains(e.relatedTarget)&&!(card&&card.contains(e.relatedTarget)))hide()});
document.addEventListener('focusin',e=>{const a=link(e);if(a&&key(a)){clearTimeout(hideT);show(a)}});
document.addEventListener('focusout',e=>{if(link(e))hide()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
addEventListener('scroll',()=>{if(cur)close()},{passive:true});addEventListener('resize',()=>{if(cur)close()});})();`;

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(p);
    else if (entry.name.endsWith('.html')) yield p;
  }
}

export default function paperPreviews() {
  return {
    name: 'paper-previews',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const indexFile = join(root, 'paper-previews.json');
        let index;
        try {
          index = JSON.parse(await readFile(indexFile, 'utf8'));
        } catch {
          logger.warn('paper-previews.json not found; skipping previews');
          return;
        }
        let pages = 0;
        for await (const file of htmlFiles(root)) {
          const html = await readFile(file, 'utf8');
          const subset = {};
          for (const [, id] of html.matchAll(ARXIV)) if (index[id]) subset[id] = index[id];
          if (!Object.keys(subset).length) continue;
          const data = JSON.stringify(subset).replace(/</g, '\\u003c');
          const inject = `<script type="application/json" id="paper-previews">${data}</script><script>${CLIENT}</script>`;
          await writeFile(file, html.replace('</body>', `${inject}</body>`));
          pages++;
        }
        await rm(indexFile);
        logger.info(`paper previews added to ${pages} pages (${Object.keys(index).length} papers indexed)`);
      },
    },
  };
}
