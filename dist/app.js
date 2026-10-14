import {CONFIG,stateAt,smooth,clamp} from './timeline.mjs';
import {createSound} from './sound.mjs';
const audio=createSound();
const $=id=>document.getElementById(id),rm=matchMedia('(prefers-reduced-motion: reduce)');
let reduced=rm.matches,paused=false,p=0,world=null,lenis=null,scrollTrigger=null,visible=true,dirty=true,lastP=-1,lastChapter=-1,clock=0,lastTime=0,slowFrames=0,samples=0,qualityChanged=0,rafId=0,renderP=0,contextLost=false;
const copies=Array.from(document.querySelectorAll('[data-copy]')),rail=Array.from(document.querySelectorAll('.chapter-rail button')),bars=Array.from(document.querySelectorAll('.sound-mark i'));
const focusButtons=[...document.querySelectorAll('[data-focus]')];
focusButtons.forEach(b=>b.onclick=()=>{const i=Number(b.dataset.focus);world?.setFocus(i);focusButtons.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('culture-description').textContent=['Carry the night into the everyday.','Follow the sound. Find the night.','Same frequency. New company.'][i];dirty=true;});
function soundState(){ $('sound-toggle').textContent=audio.active?'SOUND: ON':'SOUND: OFF';$('sound-toggle').setAttribute('aria-pressed',String(audio.active));}
$('sound-toggle').onclick=async()=>{try{await audio.toggle();soundState();}catch(e){$('sound-toggle').textContent='SOUND UNAVAILABLE';}};
// Masked line reveals stay deterministic when the user reverses the scroll.
const lineGroups=copies.map(el=>{const h=el.querySelector('h1,h2');if(h.tagName==='H1'){[...h.children].forEach(line=>{line.classList.add('line-mask');line.innerHTML='<span class="word">'+line.innerHTML+'</span>';});}else h.innerHTML=h.innerHTML.split(/<br\s*\/?>/i).map(line=>'<span class="line-mask"><span class="word">'+line+'</span></span>').join('');return [...h.querySelectorAll('.word')];});
$('journey').style.height=CONFIG.screens*100+'svh';
function range(){return Math.max(1,$('journey').offsetHeight-$('stage').offsetHeight)}
function closeMenu(){ $('chapter-menu').hidden=true;$('menu-toggle').setAttribute('aria-expanded','false'); }
function jump(target){closeMenu();const y=target*range();if(lenis)lenis.scrollTo(y,{duration:1.5,immediate:reduced});else scrollTo({top:y,behavior:reduced?'instant':'smooth'});}
for(const el of document.querySelectorAll('[data-jump]'))el.addEventListener('click',e=>{e.preventDefault();jump(Number(el.dataset.jump));});
document.querySelector('.logo').addEventListener('click',e=>{e.preventDefault();jump(0)});$('replay').onclick=()=>jump(0);
$('next').onclick=()=>{const next=CONFIG.chapters.find(c=>c.at>p+.025);if(next)jump(next.at);else $('closing').scrollIntoView({behavior:reduced?'instant':'smooth'});};
$('menu-toggle').onclick=()=>{const open=$('chapter-menu').hidden;$('chapter-menu').hidden=!open;$('menu-toggle').setAttribute('aria-expanded',String(open));if(open)$('chapter-menu').querySelector('button').focus();};
addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();$('menu-toggle').focus();}if(e.key==='Tab'&&!$('chapter-menu').hidden){const items=[$('menu-toggle'),...$('chapter-menu').querySelectorAll('button')],first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
function motion(){if(lenis){lenis.destroy();lenis=null}if(!reduced&&window.Lenis){lenis=new Lenis({duration:1.1,smoothWheel:true,syncTouch:false});if(window.ScrollTrigger)lenis.on('scroll',ScrollTrigger.update);}$('motion').textContent=reduced?'MOTION: REDUCED':'MOTION: FULL';$('motion').setAttribute('aria-pressed',String(reduced));document.body.classList.toggle('reduced',reduced);dirty=true;}
$('motion').onclick=()=>{reduced=!reduced;motion();};rm.addEventListener('change',e=>{reduced=e.matches;motion()});
$('ambient').onclick=()=>{paused=!paused;$('ambient').textContent=paused?'LIGHT: PAUSED':'LIGHT: LIVE';$('ambient').setAttribute('aria-pressed',String(paused));dirty=true;};
function updateUI(){const state=stateAt(p);copies.forEach((el,i)=>{let op=reduced?(i===state.chapter?1:0):state.copy[i];lineGroups[i].forEach((line,j)=>{const amount=reduced?1:clamp(op*1.4-j*.12);line.style.transform=`translate3d(0,${(1-amount)*108}%,0)`;});el.style.opacity=op;el.style.visibility=op>.01?'visible':'hidden';el.setAttribute('aria-hidden',String(op<.01));el.inert=op<.01;el.style.transform=reduced?'none':`translate3d(0,${(1-op)*22}px,0)`;});
$('progress').style.transform=`scaleX(${p})`;
const edges=CONFIG.boundaries;$('transition-shade').style.opacity=reduced?Math.max(...edges.map(e=>1-smooth(0,.018,Math.abs(p-e)))):0;
const h=Math.floor(state.clock/60),m=state.clock%60;$('clock').textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
if(lastChapter!==state.chapter){document.body.dataset.act=state.chapter;$('act-number').textContent=String(state.chapter).padStart(2,'0');$('chapter-name').textContent=CONFIG.chapters[state.chapter].name;rail.forEach((b,i)=>b.setAttribute('aria-current',String(i===state.chapter)));$('next').innerHTML=(state.chapter===0?'SCROLL TO ENTER':state.chapter===5?'INTO THE MORNING':'KEEP GOING')+' <span>↓</span>';lastChapter=state.chapter;}
if(reduced)renderP=CONFIG.chapters[state.chapter].at;else renderP=p;
}
function tick(t){if(!visible)return;const dt=lastTime?Math.min(.08,t-lastTime):.016;lastTime=t;if(lenis)lenis.raf(t*1000);if(!scrollTrigger)p=clamp(scrollY/range());const scrolled=Math.abs(p-lastP)>.000005;if(!paused&&!reduced)clock=audio.active?audio.time:clock+dt;if(scrolled||dirty){updateUI();lastP=p;}
const inside=scrollY<range()+$('stage').offsetHeight;if(world&&!contextLost&&inside&&(scrolled||dirty||(!paused&&!reduced))){try{world.render(renderP,clock,reduced);}catch(e){fallback('STATIC VIEW');console.error(e);world=null;}if(!paused&&!reduced){samples++;if(dt>1/42)slowFrames++;if(samples>=180){if(slowFrames>75&&world&&qualityChanged<2){world.lowerQuality();qualityChanged++;}samples=slowFrames=0;}}}
if(!reduced&&!paused&&stateAt(p).chapter===3){bars.forEach((bar,i)=>{bar.style.transform=`scaleY(${.25+.75*Math.abs(Math.sin(clock*3.8+i*.65))})`;});}
dirty=false;}
function fallback(label){document.body.classList.remove('world-ready');$('scene-status').textContent=label;$('ambient').disabled=true;}
if(window.gsap&&window.ScrollTrigger){gsap.registerPlugin(ScrollTrigger);scrollTrigger=ScrollTrigger.create({trigger:'#journey',start:'top top',end:'bottom bottom',onUpdate:self=>{p=self.progress;dirty=true;}});}
motion();updateUI();
function start(){if(window.gsap){gsap.ticker.add(tick);}else{const loop=ms=>{tick(ms/1000);rafId=requestAnimationFrame(loop)};rafId=requestAnimationFrame(loop)}}
function stop(){if(window.gsap)gsap.ticker.remove(tick);else cancelAnimationFrame(rafId)}
document.addEventListener('visibilitychange',()=>{visible=!document.hidden;lastTime=0;if(visible){dirty=true;start()}else{stop();audio.pause();soundState();}});
let resizeTimer;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(world)world.resize();if(scrollTrigger)scrollTrigger.refresh();dirty=true;},150)},{passive:true});
new IntersectionObserver(entries=>{document.querySelector('.header').classList.toggle('closing-header',entries[0].isIntersecting&&entries[0].boundingClientRect.top<90)},{rootMargin:'-80px 0px -85% 0px'}).observe($('closing'));
$('world').addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;fallback('GRAPHICS PAUSED');});$('world').addEventListener('webglcontextrestored',()=>{contextLost=false;dirty=true;document.body.classList.add('world-ready');$('ambient').disabled=false;});
start();
try{await document.fonts.ready;const module=await import('./world.mjs');world=module.createWorld($('world'));world.render(renderP,0,reduced);document.body.classList.add('world-ready');$('scene-status').textContent='';window.__sceneReady=true;}catch(e){fallback('STATIC VIEW / SCROLL TO EXPLORE');console.error('WebGL unavailable; keeping the accessible page.',e);window.__sceneReady=false;}
dirty=true;if(scrollTrigger)ScrollTrigger.refresh();
// Read-only diagnostics for verification. No synthetic frame-rate claims.
window.__ravers={get progress(){return p},get chapter(){return stateAt(p).chapter},get reducedMotion(){return reduced},get rendering(){return !!world&&!contextLost},get drawCalls(){return world?.renderer.info.render.calls||0},get triangles(){return world?.renderer.info.render.triangles||0},get resolutionScale(){return world?.renderer.getPixelRatio()||0}};
