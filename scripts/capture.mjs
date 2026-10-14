// Deterministic review renders of the built hero (dist/). Stills and video drive
// the real frame() loop through ?capture=1, so damping, holds and doors match a
// real scroll. Software GL (SwiftShader) is used when no GPU is available; it
// checks composition and motion, not frame rate.
//
//   node scripts/capture.mjs stills [--page index.html] [--out review/stills] [--size 1440x900] [--portrait]
//   node scripts/capture.mjs views  --views views.json [--page …] [--out …] [--size …]
//        views.json: [{"name":"booth-low","progress":3,"pos":[x,y,z],"target":[x,y,z],"fov":40}, …]
//        Renders the world state at each progress from a free camera (planned views, debugging).
//   node scripts/capture.mjs video  [--page index.html] [--out review/video] [--size 1280x720]
//                                   [--fps 30] [--seconds 26] [--reduced]
import {createServer} from 'node:http';
import {readFile, mkdir, rm} from 'node:fs/promises';
import {extname, join, normalize, resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';

const args = process.argv.slice(2);
const mode = args[0] || 'stills';
const opt = (name, fallback) => {const i = args.indexOf('--' + name); return i < 0 ? fallback : args[i + 1];};
const flag = name => args.includes('--' + name);
const page = opt('page', 'index.html');
const out = resolve(opt('out', `review/${mode}`));
const [W, H] = opt('size', mode === 'video' ? '1280x720' : '1440x900').split('x').map(Number);
const fps = Number(opt('fps', 30)), seconds = Number(opt('seconds', 26));

const root = resolve('dist');
const types = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png',
 '.webp': 'image/webp', '.ttf': 'font/ttf', '.json': 'application/json', '.svg': 'image/svg+xml'};
const server = createServer(async (req, res) => {
 const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
 const file = join(root, path || page);
 if (!file.startsWith(root)) {res.writeHead(403).end(); return;}
 try {res.writeHead(200, {'content-type': types[extname(file)] || 'application/octet-stream'}).end(await readFile(file));}
 catch {res.writeHead(404).end();}
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/${page}?capture=1`;

const browser = await chromium.launch({
 executablePath: process.env.CHROMIUM_PATH || undefined,
 args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
});

async function open(width, height, reduced = false) {
 const ctx = await browser.newContext({viewport: {width, height}, deviceScaleFactor: 1, reducedMotion: reduced ? 'reduce' : 'no-preference'});
 const tab = await ctx.newPage();
 const errors = [];
 tab.on('pageerror', e => errors.push(e.message));
 tab.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
 await tab.goto(base, {waitUntil: 'load'});
 await tab.waitForFunction(() => window.__ravers?.capture || window.__ravers?.fallback, null, {timeout: 120000});
 const failed = await tab.evaluate(() => window.__ravers.fallback && window.__ravers.error);
 if (failed) throw new Error('Scene fell back: ' + failed);
 return {tab, ctx, errors};
}

// Named review moments in raw scroll progress (0 entrance … 5 afterglow).
const MOMENTS = [
 ['00-entrance', 0], ['01-doors-opening', .6], ['02-threshold', 1], ['03-crossing', 1.6], ['04-hall', 2],
 ['05-approach', 2.55], ['06-booth', 3], ['07-turn', 3.55], ['08-first-light', 4], ['09-walk-out', 4.5], ['10-afterglow', 5]
];

async function stills() {
 await rm(out, {recursive: true, force: true});
 const sizes = [[W, H, '']];
 if (flag('portrait')) sizes.push([390, 844, '-portrait']);
 for (const [w, h, suffix] of sizes) {
  const {tab, ctx, errors} = await open(w, h, flag('reduced'));
  await mkdir(out, {recursive: true});
  for (const [name, p] of MOMENTS) {
   const info = await tab.evaluate(p => {const c = window.__ravers.capture; c.pose(c.scrollFor(p)); return c.step(c.scrollFor(p));}, p);
   await tab.screenshot({path: join(out, `${name}${suffix}.png`), timeout: 180000});
   console.log(`${name}${suffix}`, JSON.stringify({progress: +info.progress.toFixed(3), smooth: +info.smooth.toFixed(3)}));
  }
  if (errors.length) console.log('page errors:\n' + errors.join('\n'));
  await ctx.close();
 }
}

// One continuous scroll-through: lead-in hold, eased scroll with the page's own
// damping and holds, tail hold. Ambient time advances at real rate.
async function video() {
 const frames = join(out, 'frames');
 await rm(out, {recursive: true, force: true}); await mkdir(frames, {recursive: true});
 const {tab, ctx, errors} = await open(W, H, flag('reduced'));
 const max = await tab.evaluate(() => window.__ravers.capture.maxScroll());
 const total = Math.round(fps * seconds), lead = Math.round(fps * 1.6), tail = Math.round(fps * 2.4);
 const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
 await tab.evaluate(() => window.__ravers.capture.pose(0));
 const started = Date.now();
 for (let f = 0; f < total; f++) {
  const u = Math.min(1, Math.max(0, (f - lead) / (total - lead - tail)));
  // Mostly linear with soft ends, so every chapter gets equal screen time.
  const y = Math.round(max * (.82 * u + .18 * ease(u)));
  await tab.evaluate(([y, dt]) => window.__ravers.capture.step(y, dt), [y, 1 / fps]);
  await tab.screenshot({path: join(frames, `f${String(f).padStart(5, '0')}.png`), timeout: 180000});
  if (f % fps === 0) console.log(`frame ${f}/${total}  ${((Date.now() - started) / 1000).toFixed(0)}s`);
 }
 if (errors.length) console.log('page errors:\n' + errors.join('\n'));
 await ctx.close();
 const mp4 = join(out, `ravers-${W}x${H}${flag('reduced') ? '-reduced' : ''}.mp4`);
 execFileSync(process.env.FFMPEG || 'ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', join(frames, 'f%05d.png'),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow', '-movflags', '+faststart', mp4], {stdio: 'inherit'});
 console.log('wrote', mp4);
}

async function views() {
 const list = JSON.parse(await readFile(opt('views', 'views.json'), 'utf8'));
 await rm(out, {recursive: true, force: true}); await mkdir(out, {recursive: true});
 const {tab, ctx, errors} = await open(W, H, flag('reduced'));
 for (const v of list) {
  await tab.evaluate(v => {const c = window.__ravers.capture; return c.look(c.scrollFor(v.progress), v.pos, v.target, v.fov);}, v);
  await tab.screenshot({path: join(out, `${v.name}.png`), timeout: 180000});
  console.log(v.name);
 }
 if (errors.length) console.log('page errors:\n' + errors.join('\n'));
 await ctx.close();
}

try {mode === 'video' ? await video() : mode === 'views' ? await views() : await stills();}
finally {await browser.close(); server.close();}
