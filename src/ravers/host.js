/* Canvas-only lifecycle. The archived Kage document is untouched. */
const RV_HOST={cleanups:[],failed:false};
function rvListen(target,type,fn,options){target.addEventListener(type,fn,options);RV_HOST.cleanups.push(()=>target.removeEventListener(type,fn,options));}
wireReveals=wireForegroundStages=wireNav=wireHeroExit=wireFocus=function(){};
buildCards=function(){CARDS.length=0;};
wireCursor=function(){if(COARSE||REDUCE)return;rvListen(window,'pointermove',e=>{RIG.tmx=(e.clientX/vpW()*2-1)*.35;RIG.tmy=(1-e.clientY/vpH()*2)*.35;},{passive:true});};
function rvDispose(){if(RV.disposed)return;RV.disposed=true;running=false;RV.audio?.pause();RV.environment?.dispose?.();RV.grade?.dispose?.();RV.choreography?.dispose?.();RV_HOST.cleanups.splice(0).forEach(fn=>fn());const resources=new Set();scene?.traverse(o=>{if(o.geometry)resources.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m){Object.values(m).forEach(v=>{if(v?.isTexture)resources.add(v);});resources.add(m);}});resources.forEach(r=>r.dispose());POST.levels?.forEach(l=>{l.a.dispose();l.b.dispose();});for(const r of Object.values(POST))if(r?.dispose)r.dispose();renderer?.dispose();}
rvWire=function(){
 rvListen(window,'keydown',async e=>{if(e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||'')||e.target?.isContentEditable)return;
  if(e.code==='KeyP'){RV.paused=!RV.paused;RV.dirty=true;canvas.setAttribute('aria-label','RAVERS.IN warehouse. Ambient motion '+(RV.paused?'paused':'playing')+'. Scroll to explore. Press P to toggle motion, M for sound.');}
  if(e.code==='KeyM'){try{if(!RV.audio){const m=await import('/sound.mjs');RV.audio=m.createSound();}await RV.audio.toggle();}catch(err){console.warn('Audio unavailable',err);}}
 });
 rvListen(document,'visibilitychange',()=>{if(document.hidden){running=false;RV.audio?.pause();}else if(!RV.disposed&&!RV.contextLost&&!running){running=true;tPrev=performance.now();RV.dirty=true;queue();}});
 rvListen(window,'resize',()=>resize(),{passive:true});
 rvListen(canvas,'webglcontextlost',e=>{e.preventDefault();RV.contextLost=true;running=false;document.documentElement.classList.add('no-webgl');canvas.setAttribute('aria-label','Graphics paused. Reload to restore the warehouse journey.');});
 rvListen(canvas,'webglcontextrestored',()=>location.reload());
 rvListen(window,'pagehide',e=>{running=false;RV.audio?.pause();if(!e.persisted)rvDispose();});
 rvListen(window,'pageshow',e=>{if(e.persisted&&!RV.disposed&&!RV.contextLost){running=true;tPrev=performance.now();RV.dirty=true;queue();}});
 const media=matchMedia('(prefers-reduced-motion: reduce)');rvListen(media,'change',e=>{REDUCE=e.matches;RV.paused=REDUCE;RIG.tmx=RIG.tmy=0;RV.dirty=true;});
 window.__raversConfig=RV_CONFIG;
};
fallback=function(err){running=false;RV_HOST.failed=true;document.documentElement.classList.add('no-webgl');canvas.setAttribute('aria-label','RAVERS.IN. The 3D warehouse could not load. Reload to try again.');console.error('RAVERS world failed',err);window.__ravers={fallback:true,error:String(err)};};
boot=async function(){try{await Promise.all([document.fonts.load("32px Anton"),document.fonts.load("16px Archivo")]);await document.fonts.ready;for(const [,job] of JOBS)await job();start();}catch(err){fallback(err);}};
start=function(){resize();wireCursor();const shot=Q.get('shot');if(shot!==null)scrollTo(0,anchors[clamp(parseInt(shot,10)||0,0,5)]);RIG.smooth=RIG.prog=rvTravel(progressFor(scrollY));RIG.intro=1;WORD.reveal=1.2;fadeIn=1;INTRO.t0=0;running=true;tPrev=performance.now();queue();window.__ravers={RIG,WORLD,WORD,CAM,POST,renderer,scene,camera,anchors:()=>anchors};};
// On-demand diagnostics: actual render cadence and CPU submission time, not GPU timing.
const RV_PERF={intervals:new Float32Array(120),cpu:new Float32Array(120),count:0,index:0,last:0};
const rvProfileRender=render;
render=function(){const now=performance.now(),gap=now-RV_PERF.last;const begun=now;rvProfileRender();const cpu=performance.now()-begun;
 if(RV_PERF.last&&gap>0&&gap<250&&!RV.paused){RV_PERF.intervals[RV_PERF.index]=gap;RV_PERF.cpu[RV_PERF.index]=cpu;RV_PERF.index=(RV_PERF.index+1)%120;RV_PERF.count=Math.min(120,RV_PERF.count+1);}else if(gap>=250){RV_PERF.count=0;RV_PERF.index=0;}
 RV_PERF.last=now;
};
RV_PERF.snapshot=function(){const n=RV_PERF.count,dt=Array.from(RV_PERF.intervals.slice(0,n)).sort((a,b)=>a-b),cpu=Array.from(RV_PERF.cpu.slice(0,n)).sort((a,b)=>a-b);return {samples:n,renderCadenceFPS:n?+(1000/(dt.reduce((a,b)=>a+b,0)/n)).toFixed(1):null,p95FrameIntervalMs:n?+dt[Math.min(n-1,Math.floor(n*.95))].toFixed(2):null,p95CpuSubmissionMs:n?+cpu[Math.min(n-1,Math.floor(n*.95))].toFixed(2):null,reflection:RV.environment?.mode,renderScale:PERF.scale,paused:RV.paused,reducedMotion:REDUCE,gpuTimingMeasured:false};};
const rvProfileStart=start;start=function(){rvProfileStart();window.__ravers.metrics=RV_PERF.snapshot;};
