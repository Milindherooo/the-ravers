/* Colour grade and post-processing direction. Runs after environment.js and
   before camera.js. Owns POST uniform targets and tone curve only.

   Every value is a pure function of RIG.smooth (progress 0-5), sampled from the
   key table below with C1 smoothstep easing between keys, so a reverse scrub
   lands on the same numbers. WORLD.uT / `clock` only seeds the dither (it is
   frozen when paused or in reduced motion). Nothing here reads the beat.

   POST.comp is patched once, right after initPost, inside the existing pass:
   - the dead chromatic-aberration taps become one texture fetch (uCA is 0 for good);
   - Kage's two neutralised split-tone constants become uShadowTint / uHighTint
     (the only two uniforms added). The luma of uShadowTint is the black point,
     its chroma tints the shadows; uHighTint is a gain on the highlights;
   - grain moves after the display encode, as +-uGrain/2 dither (it was added in
     linear light, which turned .007 into visible speckle in every shadow).
   POST.bright's bloom source takes the displayed hue at the scene luminance (no uniform).
   The bloom chain is repaired: Kage's renderPost hands render targets, not their
   .texture, to the blur, upsample and comp samplers. three r149 binds nothing for a
   target, so those passes sampled black and the bloom added nothing. The sampler
   uniforms now resolve a target to its texture. Kage also left renderer.autoClear
   on, so every additive upsample first wiped its target to the clear colour #05070a:
   each level lost its own blur and a blue-black floor reached every pixel. renderPost
   now runs with autoClear off (pass() already clears the passes that should be cleared).
   LOW keeps two bloom levels (8 passes instead of 16). No pass or target is added. */
const RV_GRADE_CONFIG=(()=>{
 const C=RV_CONFIG;
 // exp: uExp; bloom: uBloom; thr/knee: POST.bright (scene-referred luminance, before exposure);
 // sat: uSat; vig: uVig; grain: uGrain (display-space dither); shadow/high: split-tone (see notes).
 const night={exp:.91,bloom:.12,thr:1.00,knee:.50,sat:1.00,vig:.22,grain:.004,shadow:[-.012,-.012,-.012],high:[1,1,1]};
 const hall ={exp:1.00,bloom:.14,thr:1.00,knee:.50,sat:.95,vig:.28,grain:.004,shadow:[-.004,-.004,-.004],high:[1,1,1]};
 const door ={exp:.65,bloom:.18,thr:1.90,knee:.60,sat:1.00,vig:.18,grain:.004,shadow:[-.016,-.010,-.004],high:[1,1,1]};
 const out  ={exp:.60,bloom:.10,thr:3.00,knee:.60,sat:1.00,vig:.15,grain:.004,shadow:[-.067,-.042,-.012],high:[1,1,1]};
 const day  ={exp:.62,bloom:.09,thr:2.60,knee:.60,sat:1.00,vig:.10,grain:.004,shadow:[-.067,-.042,-.012],high:[1,1,1]};
 return {
  keys:[
   [0,night],
   [C.doorOpen[1],night],            // 1.20: the Spill is held through the open doors
   [1.75,hall],                      // eye adapts to the hall as its fog closes in (env fog 1.15-1.75)
   [C.redOut[0],hall],               // 3.55: hold the hall until the red starts to go
   [4.0,door],                       // eye adapting to the doorway as the dawn comes up
   [4.25,{...door,exp:.58,thr:2.90}], // the dawn sky doubles by 4.35: hold the doorway, only the sun blooms
   [4.5,out],                        // threshold, looking out toward the low sun
   [4.85,day],[5,day]
  ],
  lowLevels:2,                        // LOW: bloom levels kept (of 4); 8 post passes instead of 16
  lowBloomGain:1.15                   // LOW: two levels carry less energy than four
 };
})();
const RV_GRADE={config:RV_GRADE_CONFIG,patched:false,disposed:false,original:null,low:null,state:null,samplers:null,
 uniforms:{uShadowTint:{value:new THREE.Vector3()},uHighTint:{value:new THREE.Vector3(1,1,1)}}};
RV.grade=RV_GRADE;

function rvGradeOut(){return {progress:0,exp:0,bloom:0,thr:0,knee:0,sat:0,vig:0,grain:0,ca:0,shadow:[0,0,0],high:[1,1,1]};}
// Pure: same progress, same numbers. Writes into `out` (no allocation when one is passed).
function rvGradeSample(progress,out=rvGradeOut()){
 const K=RV_GRADE_CONFIG.keys,p=Number.isFinite(progress)?Math.max(0,Math.min(5,progress)):0;
 let i=0;while(i<K.length-2&&p>K[i+1][0])i++;
 const [p0,a]=K[i],[p1,b]=K[i+1],x=p1>p0?Math.max(0,Math.min(1,(p-p0)/(p1-p0))):1,t=x*x*(3-2*x),mix=(u,v)=>u+(v-u)*t;
 out.progress=p;out.ca=0;
 for(const k of ['exp','bloom','thr','knee','sat','vig','grain'])out[k]=mix(a[k],b[k]);
 for(let c=0;c<3;c++){out.shadow[c]=mix(a.shadow[c],b.shadow[c]);out.high[c]=mix(a.high[c],b.high[c]);}
 // Never tint shadows red: red may only sit at or below the other two channels.
 out.shadow[0]=Math.min(out.shadow[0],out.shadow[1],out.shadow[2]);
 return out;
}
RV_GRADE.sample=rvGradeSample;

function rvGradePatch(){
 const G=RV_GRADE;if(G.disposed||G.patched||!POST.comp)return;
 const m=POST.comp,src=m.fragmentShader;
 const swaps=[
  [' float ca = uCA * (0.30 + r2*2.6) * 0.0013;\n',''],
  [' vec3 c;\n c.r = texture2D(tS, vUv + d*ca).r;\n c.g = texture2D(tS, vUv).g;\n c.b = texture2D(tS, vUv - d*ca).b;\n',
   ' vec3 c = texture2D(tS, vUv).rgb;\n'],
  [' c = mix(c, c*vec3(1.0,1.0,1.0), smoothstep(0.55,0.0,l)*0.80);\n c = mix(c, c*vec3(1.0,1.0,1.0), smoothstep(0.50,1.0,l)*0.26);\n',
   ' c *= mix(vec3(1.0), uHighTint, smoothstep(0.25,1.0,l));\n'],
  [' float g = fract(sin(dot(vUv*uRes + uT*137.0, vec2(12.9898,78.233)))*43758.5453);\n c += (g-0.5)*uGrain;\n',''],
  [' gl_FragColor = vec4( e, 1.0 );\n',
   ' float le = dot(e, vec3(0.2126,0.7152,0.0722)), sm = dot(uShadowTint, vec3(0.2126,0.7152,0.0722));\n'+
   ' float wb = 1.0 - smoothstep(0.0, 0.25, le); wb *= wb;\n'+
   ' e *= max(le + sm*wb, 0.0) / max(le, 1e-4);\n'+
   ' e += (uShadowTint - sm) * smoothstep(0.0, 0.08, le) * (1.0 - smoothstep(0.18, 0.55, le));\n'+
   ' float g = fract(sin(dot(vUv*uRes + uT*137.0, vec2(12.9898,78.233)))*43758.5453);\n'+
   ' gl_FragColor = vec4( clamp(e + (g-0.5)*uGrain, 0.0, 1.0), 1.0 );\n']
 ];
 // Bright pass: the bloom source takes the hue the viewer sees (the comp's ACES fit at a
 // nominal exposure of .8) at the source's own scene luminance. The display-solved practicals
 // carry red:green near 30:1 in HDR, so their raw bloom fringed red around an orange core.
 const bsrc=POST.bright.fragmentShader,bswap=[' gl_FragColor = vec4(c*k, 1.0); }',
  ' vec3 x = c*0.8, d = clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0);\n'+
  ' gl_FragColor = vec4(d * (l / max(dot(d, vec3(0.2126,0.7152,0.0722)), 1e-4)) * k, 1.0); }'];
 const missing=swaps.filter(([from])=>!src.includes(from)).concat(bsrc.includes(bswap[0])?[]:[bswap]);
 if(missing.length){console.warn('RAVERS grade: POST shaders changed upstream; split-tone, dither, black point and bloom hue not applied',missing.map(s=>s[0].trim()));return;}
 let next='uniform vec3 uShadowTint; uniform vec3 uHighTint;\n'+src;
 for(const [from,to] of swaps)next=next.replace(from,to);
 G.original={fragmentShader:src,brightShader:bsrc,values:{}};
 POST.bright.fragmentShader=bsrc.replace(bswap[0],bswap[1]);POST.bright.needsUpdate=true;
 for(const k of ['uExp','uBloom','uSat','uVig','uGrain','uCA'])G.original.values[k]=m.uniforms[k].value;
 G.original.values.uThr=POST.bright.uniforms.uThr.value;G.original.values.uKnee=POST.bright.uniforms.uKnee.value;
 Object.assign(m.uniforms,G.uniforms);m.fragmentShader=next;m.needsUpdate=true;G.patched=true;
}
// A sampler uniform that accepts a render target resolves it to the target's texture.
function rvGradeSampler(u){let v=u.value;Object.defineProperty(u,'value',{configurable:true,enumerable:true,get(){return v;},set(x){v=x&&x.isWebGLRenderTarget?x.texture:x;}});u.value=v;return u;}
function rvGradeSamplers(){
 const G=RV_GRADE;if(G.disposed||G.samplers||!POST.comp)return;
 G.samplers=[POST.comp.uniforms.tS,POST.comp.uniforms.tB,POST.bright.uniforms.tS,POST.blur.uniforms.tS,POST.up.uniforms.tS].map(rvGradeSampler);
}
function rvGradeLow(){
 const G=RV_GRADE;if(G.disposed||!LOW||!POST.levels||POST.levels.length<=RV_GRADE_CONFIG.lowLevels)return;
 // Fewer levels, not a skipped loop: renderPost and resize() iterate POST.levels as they find them.
 const cut=POST.levels.splice(RV_GRADE_CONFIG.lowLevels);cut.forEach(l=>{l.a.dispose();l.b.dispose();});
 G.low={levels:POST.levels.length,removed:cut.length};
}
function rvGradeApply(progress){
 const G=RV_GRADE;if(G.disposed||!POST.comp)return;
 const s=G.state=rvGradeSample(progress,G.state||rvGradeOut()),U=POST.comp.uniforms,B=POST.bright.uniforms;
 U.uExp.value=s.exp;U.uBloom.value=s.bloom*(G.low?RV_GRADE_CONFIG.lowBloomGain:1);U.uSat.value=s.sat;U.uVig.value=s.vig;
 U.uGrain.value=s.grain;U.uCA.value=0;B.uThr.value=s.thr;B.uKnee.value=s.knee;
 G.uniforms.uShadowTint.value.fromArray(s.shadow);G.uniforms.uHighTint.value.fromArray(s.high);
}
RV_GRADE.dispose=function(){
 const G=RV_GRADE;if(G.disposed)return;G.disposed=true;
 if(G.patched&&POST.comp){const m=POST.comp,o=G.original;m.fragmentShader=o.fragmentShader;
  for(const k of ['uExp','uBloom','uSat','uVig','uGrain','uCA'])m.uniforms[k].value=o.values[k];
  POST.bright.uniforms.uThr.value=o.values.uThr;POST.bright.uniforms.uKnee.value=o.values.uKnee;
  delete m.uniforms.uShadowTint;delete m.uniforms.uHighTint;m.needsUpdate=true;
  POST.bright.fragmentShader=o.brightShader;POST.bright.needsUpdate=true;G.patched=false;}
 if(G.samplers){for(const u of G.samplers){const v=u.value;delete u.value;u.value=v;}G.samplers=null;}
};
const rvGradeInitPost=initPost;
initPost=function(){rvGradeInitPost();rvGradePatch();rvGradeSamplers();rvGradeLow();if(POST.comp)rvGradeApply(RIG.smooth);};
const rvGradeRender=render;
render=function(){rvGradeApply(RIG.smooth);rvGradeRender();};
const rvGradeRenderPost=renderPost;
renderPost=function(){
 if(RV_GRADE.disposed)return rvGradeRenderPost();
 const clear=renderer.autoClear;renderer.autoClear=false;
 try{rvGradeRenderPost();}finally{renderer.autoClear=clear;}
};
