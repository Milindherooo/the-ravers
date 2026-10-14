// Colour & post (src/ravers/grade.js): CPU checks of the pure grade curve and the POST.comp patch.
// Runs the engine's own initPost/renderPost (from RV_PAGE, default dist/index.html) with grade.js
// source on top, so the shader anchors are tested against the real comp pass. GPU output is not.
//   node tests/grade.test.cjs            RV_PAGE=dist/preview-grade.html node tests/grade.test.cjs
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..'),page=process.env.RV_PAGE||'dist/index.html';
const html=fs.readFileSync(path.join(root,page),'utf8'),src=fs.readFileSync(path.join(root,'src/ravers/grade.js'),'utf8');
const world=fs.readFileSync(path.join(root,'src/ravers/world.js'),'utf8');
const grab=(re,what)=>{const m=html.match(re)||world.match(re);assert(m,what+' not found');return m[0];};
const engine=[grab(/const QUAD_VS = [^\n]+\n/,'QUAD_VS'),grab(/function initPost\(\) \{[\s\S]*?\n\}\n/,'initPost'),grab(/function renderPost\(\) \{[\s\S]*?\n\}\n/,'renderPost'),
 grab(/const RV_CONFIG=\{[\s\S]*?\]\};/,'RV_CONFIG')].join('\n');
const three=fs.readFileSync(path.join(root,'dist/landing-pages/secret-pathways-assets/three.min.js'),'utf8');

function boot(low){
 const ctx={console:{...console,warn:(...a)=>{throw new Error('grade warned: '+a.join(' '));}}};vm.createContext(ctx);vm.runInContext(three,ctx);
 vm.runInContext(`const LOW=${low},WANT_POST=true,RV={},RIG={smooth:0},WORLD={uT:{value:0}},POST={levels:[]};let clock=0,passes=0,targets=0,disposed=0;
  const renderer={domElement:{width:1440,height:900},autoClear:true};const clears=[];function pass(){passes++;clears.push(renderer.autoClear);}
  const RT=THREE.WebGLRenderTarget;THREE.WebGLRenderTarget=class extends RT{constructor(...a){super(...a);targets++;}dispose(){disposed++;super.dispose();}};
  let render=function(){};\n${engine}\nconst preGrade={initPost,render};`,ctx);
 vm.runInContext(src+`\n;globalThis.T={RV,RIG,POST,initPost,render,renderPost,RV_CONFIG,preGrade,get passes(){return passes},clears,renderer,set passes(v){passes=v},get targets(){return targets},get disposed(){return disposed}};`,ctx);
 return ctx.T;
}

// ---- High tier: patch, curve, uniforms, passes.
const T=boot(false),G=T.RV.grade;
assert(T.initPost!==T.preGrade.initPost&&T.render!==T.preGrade.render,'grade wraps initPost and render cooperatively');
const t0=T.targets;T.initPost();const C=T.POST.comp,B=T.POST.bright;
assert(G.patched,'POST.comp patched');assert.equal(T.POST.levels.length,4);assert.equal(T.targets-t0,9,'initPost alone creates its 9 targets: no new render target');
const fs0=G.original.fragmentShader,fs1=C.fragmentShader,added=Object.keys(C.uniforms).filter(k=>!fs0.includes(k));
assert.deepEqual(added.sort(),['uHighTint','uShadowTint'],'exactly two uniforms added');for(const k of added)assert(C.uniforms[k].value.isVector3,'split-tone uniforms are vec3');
assert(!/d\*ca|texture2D\(tS, vUv \+/.test(fs1)&&(fs1.match(/texture2D\(tS/g)||[]).length===1,'CA taps removed: one scene fetch');
assert(!fs1.includes('c += (g-0.5)*uGrain')&&fs1.indexOf('pow(max(c,0.0)')<fs1.indexOf('(g-0.5)*uGrain'),'grain is display-space dither, after the encode');
assert(fs1.includes('aces(c)')&&fs1.includes('uExp')&&fs1.includes('uVig')&&fs1.includes('uFade'),'ACES, exposure, vignette and fade kept');
T.passes=0;T.renderPost();assert.equal(T.passes,16,'high: 16 post passes, unchanged');
// Bloom chain repairs: samplers resolve render targets to textures; the chain runs with autoClear off
// (additive upsamples no longer wipe their target); the bright pass takes the displayed hue.
assert(T.clears.length===16&&T.clears.every(c=>c===false)&&T.renderer.autoClear===true,'renderPost runs with autoClear off, then restores it');
for(const u of [C.uniforms.tB,C.uniforms.tS,B.uniforms.tS,T.POST.blur.uniforms.tS,T.POST.up.uniforms.tS]){u.value=T.POST.levels[1].a;assert.strictEqual(u.value,T.POST.levels[1].a.texture,'sampler resolves a target to its texture');}
assert(C.uniforms.tB.value.isTexture,'after renderPost the comp samples the bloom texture');
assert(B.fragmentShader.includes('(l / max(dot(d, vec3(0.2126,0.7152,0.0722)), 1e-4)) * k')&&!B.fragmentShader.includes('vec4(c*k, 1.0)'),'bloom source takes the displayed hue at scene luminance');
assert(Object.keys(B.uniforms).sort().join()==='tS,uKnee,uThr','no uniform added to the bright pass');
// No new pass, target, loop or clock in the grade source (comments stripped).
const code=src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');
assert(!/new THREE\.(WebGLRenderTarget|ShaderMaterial)|renderer\.render\(|\bpass\(|requestAnimationFrame|setTimeout/.test(code),'no pass, target or loop added');
assert(!/\bbeat|tempo|WORLD\.uT|\bclock\b|performance\.now|Date\.now|Math\.random/.test(code),'grade reads progress only: no beat, clock or randomness');

// Pure curve over 10001 samples: bounds, never-red shadows, continuity, determinism.
let prev=null,maxStep=0;const keysOf=s=>JSON.stringify(s);
for(let n=0;n<=10000;n++){
 const p=n/2000,s=G.sample(p);
 assert(['exp','bloom','thr','knee','sat','vig','grain'].every(k=>Number.isFinite(s[k]))&&s.shadow.concat(s.high).every(Number.isFinite));
 assert(s.vig<=.35&&s.vig>=0,'vignette <= .35');assert(s.grain>0&&s.grain<=.006,'grain <= .006');assert.strictEqual(s.ca,0,'CA 0');
 assert(s.shadow[0]<=s.shadow[1]&&s.shadow[0]<=s.shadow[2],'shadow tint never red at '+p);
 assert(s.shadow.every(v=>v<=0&&v>-.1),'shadow lift only ever deepens, and only a little');
 assert(Math.abs(s.high[0]-s.high[2])<=.02,'highlights stay near neutral (logo white)');
 assert(s.thr>=.9,'bright-pass threshold >= .9');
 if(prev){const d=Math.max(Math.abs(s.exp-prev.exp),Math.abs(s.bloom-prev.bloom),Math.abs(s.sat-prev.sat),Math.abs(s.vig-prev.vig));maxStep=Math.max(maxStep,d);assert(d<.004,'continuous at '+p);}
 prev=s;
}
for(const p of [0,.716,1,1.6,2,2.62,3,3.62,4,4.52,5])assert.equal(keysOf(G.sample(p)),keysOf(G.sample(p)),'pure');
const fwd=[],rev=[];for(let n=0;n<=500;n++)fwd.push(keysOf(G.sample(n/100)));for(let n=500;n>=0;n--)rev[n]=keysOf(G.sample(n/100));assert.deepEqual(fwd,rev,'reverse scrub reproduces the same grade');
// The art direction's starting values, checked at the chapter holds (ramps sit between them).
const within=(lo,hi,check)=>{for(let p=lo;p<=hi+1e-9;p+=.01)check(G.sample(p),p);};
within(0,1.2,(s,p)=>{assert(s.exp>=.85&&s.exp<=.95&&s.bloom>=.10&&s.bloom<=.14&&s.thr>=.9&&s.sat===1,'night '+p);assert(s.shadow[0]===s.shadow[2],'night shadows neutral');});
within(1.75,3.4,(s,p)=>assert(s.exp>=.95&&s.exp<=1.05&&s.bloom>=.12&&s.bloom<=.16&&s.sat>=.92&&s.sat<=.97,'hall '+p));
within(4.0,4.2,(s,p)=>assert(s.exp>=.55&&s.exp<=.65&&s.bloom>=.16&&s.bloom<=.20&&s.thr>=1,'dawn '+p));
within(4.6,5,(s,p)=>assert(s.exp>=.60&&s.exp<=.75&&s.bloom>=.08&&s.bloom<=.10,'day '+p));

// Per-frame application through the render wrapper, then dispose.
for(const p of [0,1,2,3,3.8,4,4.5,5,2,0]){T.RIG.smooth=p;T.render();const s=G.sample(p),U=C.uniforms;
 assert(U.uExp.value===s.exp&&U.uBloom.value===s.bloom&&U.uSat.value===s.sat&&U.uVig.value===s.vig&&U.uGrain.value===s.grain&&U.uCA.value===0);
 assert(B.uniforms.uThr.value===s.thr&&B.uniforms.uKnee.value===s.knee);assert.deepEqual(U.uShadowTint.value.toArray(),s.shadow);assert.deepEqual(U.uHighTint.value.toArray(),s.high);}
const bs0=G.original.brightShader;G.dispose();assert.equal(C.fragmentShader,fs0,'dispose restores the comp shader');assert.equal(B.fragmentShader,bs0,'and the bright shader');
assert(Object.getOwnPropertyDescriptor(C.uniforms.tB,'value').writable,'and plain sampler uniforms');assert(!('uShadowTint' in C.uniforms)&&C.uniforms.uVig.value===1&&C.uniforms.uExp.value===.95);
T.RIG.smooth=4;T.render();assert.equal(C.uniforms.uExp.value,.95,'disposed grade no longer drives POST');

// ---- LOW: two bloom levels, 8 passes, removed targets disposed, bloom compensated.
const L=boot(true),GL=L.RV.grade;L.initPost();
assert.equal(L.POST.levels.length,2);assert.equal(L.disposed,4,'the two cut levels are disposed');assert.deepEqual(GL.low,{levels:2,removed:2});
L.passes=0;L.renderPost();assert.equal(L.passes,8,'LOW: 8 post passes (16 - 8 through the bloom cut)');
L.RIG.smooth=0;L.render();assert(Math.abs(L.POST.comp.uniforms.uBloom.value-GL.sample(0).bloom*GL.config.lowBloomGain)<1e-12);
console.log(`PASS grade: patch (2 vec3 uniforms, 1 scene fetch, display dither, bloom chain repaired: samplers, autoClear, displayed hue), 10001 curve samples (vig<=.35, grain<=.006, CA 0, shadows never red, max step ${maxStep.toFixed(4)}), reverse scrub identical, brief holds, render wrapper, dispose, LOW 2 levels / 8 passes.`);
