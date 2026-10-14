/* RAVERS / environment layer: shading, sky and atmosphere. Same closure as world.js;
   no second animation loop, no realtime lights added. Every pool of light except the
   shadowed key is an analytic term evaluated inside one shared material hook through
   Three's own RE_Direct, so wet ground gets real specular from sources that cost no
   light slots. Reflections are clipped planar captures (high tier) or the analytic sky. */
const RV_ENV_CONFIG={
 reflection:{enabled:true,maxSize:512,minSize:192,every:3,minScale:.72,clipBias:.003,floorY:.026},
 fog:{enabled:true,opacity:.11,mobileOpacity:.065,speed:.045},
 drips:{enabled:true,period:1.6,radius:.25},
 consolidate:true,
 // Post exposure each display-authored colour is solved for (see grade notes; uExp targets from ART-DIRECTION section 6).
 exposure:{night:.9,hall:1,dawn:.62,day:.68},
 bounds:{warehouse:{min:[-11,0,-44],max:[11,10,-8]},apron:{min:[-16,0,-7.5],max:[16,14.3,17]},
  cameraLane:{min:[-3,.8,-30],max:[3,8,16]},booth:{min:[-1.25,0,-32.15],max:[1.25,1.5,-31.25]},
  doorway:{min:[-3.95,.27,-7.8],max:[3.95,8.92,-7.6]},canopy:{min:[-5.3,9.31,-8.05],max:[5.3,9.64,-4.43]},
  leafSwing:{min:[-4.2,0,-7.9],max:[4.2,8.95,-3.6]},estate:{min:[-46,0,21.5],max:[46,9.6,62]},
  yardPole:{min:[-11.1,0,-3.15],max:[-9.3,8.1,-2.85]},roadPole:{min:[7.3,0,26.35],max:[9.1,8.8,26.65]}}
};
const RV_ENV={resources:new Set(),puddles:[],puddleMesh:null,fog:[],batches:[],drips:null,sky:null,reflection:null,reflectionCamera:null,
 textureMatrix:new THREE.Matrix4(),frame:0,disposed:false,mode:'procedural',lastCapture:-99,
 stats:{consolidated:0,batches:0,hooked:0,reflected:0},hidden:[],reflectionValid:false};
RV.environment=RV_ENV;
RV_ENV.config=RV_ENV_CONFIG;
function rvEnvOwn(resource){RV_ENV.resources.add(resource);return resource;}
function rvEnvBatch(parts,material){if(!parts.length)return;const mesh=rvBatch(parts,material);mesh.castShadow=false;RV_ENV.resources.add(mesh.geometry);RV_ENV.batches.push(mesh);return mesh;}
function rvEnvBox(parts,w,h,d,x,y,z,rx=0,rz=0){const g=new THREE.BoxGeometry(w,h,d);if(rx)g.rotateX(rx);if(rz)g.rotateZ(rz);g.translate(x,y,z);parts.push(g);}

/* ------------------------------------------------------------ uniforms
   RV.environment.uniforms is the shared, render-time interface. world.js writes the
   steady base values each frame; the choreographer may multiply uSeam/uTube/uBack,
   write uConeKick (metres) and own uSpill/uDawnSpill in a wrapper that runs later. */
(function(){
 const R=RV_RIG,X=RV_ENV_CONFIG.exposure,v=x=>({value:x}),c=x=>({value:x});
 RV_ENV.col={sodium:new THREE.Color(1,.5,.14),red:rvLin(0xe8232a),sconce:rvLin(R.sconce.color),sign:rvLin(R.sign.color),lamp:rvLin(R.lamp.color),sun0:rvLin(R.sun.color[0]),sun1:rvLin(R.sun.color[1])};
 RV_ENV.base={sodium:R.sodium.intensity,road:R.road.intensity,sconce:R.sconce.intensity,sign:R.sign.intensity,seam:R.seam.intensity,spill:R.spill.intensity,
  back:R.back.intensity,tube:R.tube.intensity,lamp:R.lamp.intensity,strip:R.strip.intensity};
 RV_ENV.uniforms={uDawn:v(0),uKeySun:v(0),uSpill:v(0),uDawnSpill:v(0),uRed:v(1),uSodium:v(1),uSodRes:v(0),uRoad:v(R.road.intensity),
  uSeam:v(R.seam.intensity),uTube:v(R.tube.intensity),uBack:v(R.back.intensity),uLamp:v(R.lamp.intensity),uStrip:v(R.strip.intensity),
  uSconce:v(R.sconce.intensity),uSign:v(R.sign.intensity),uConeKick:v(0),uRoofGlow:v(0),uEnvTime:v(0),
  uSun:v(new THREE.Vector3(.24,.07,.97).normalize()),uSodPos:v(new THREE.Vector3(...R.sodium.head)),uRoadPos:v(new THREE.Vector3(...R.road.head)),
  uReflection:v(null),uTextureMatrix:v(RV_ENV.textureMatrix),uLive:v(0),uSkyZN:c(rvShow(0x120f0c,X.night)),uSkyHN:c(rvShow(0x2e2318,X.night)),uSkyZD:c(rvShow(0x8c9aa8,X.dawn)),uSkyMD:c(rvShow(0xcdb9a2,X.dawn,1.95)),
  uSkyHD:c(rvShow(0xf2b77a,X.dawn,1.95)),uSunCol:c(rvShow(0xfff1d6,X.dawn)),uHaze:c(rvShow(0xc4b29b,X.dawn)),
  uSodCol:c(RV_ENV.col.sodium),uRedCol:c(RV_ENV.col.red),uSconceCol:c(RV_ENV.col.sconce),uSignCol:c(RV_ENV.col.sign),uLampCol:c(RV_ENV.col.lamp)};
 // Hemisphere skyglow, fog and practical emitter colours (HDR linear, display-solved where noted).
 Object.assign(RV_ENV,{skyNight:rvLin(0x8f8d88),groundNight:rvLin(0x2a2723),skyDawn:rvLin(0x8c9aa8),groundDawn:rvLin(0x8a7f70),
  fogNight:rvShow(0x15100b,X.night),fogHall:rvShow(0x060606,X.hall),fogDawn:rvShow(0xb8a690,X.dawn),
  sconceOn:rvShow(0xffd2a1,X.night,1.6),sodiumOn:rvShow(0xff9b3d,X.night,1.7),lampOn:rvShow(0xffcf9a,X.hall,1.4),
  roofNight:rvShow(0x080807,X.hall),roofDawn:rvShow(0x3a3c3a,X.dawn),redOn:rvShow(0xe8232a,X.night,1.9)});
})();

/* ------------------------------------------------------------ GLSL
   The sky is one function shared by the dome, the puddles and every material's
   specular environment term, so wet ground always holds the current sky. */
const RV_SKY_GLSL=`
uniform float uDawn; uniform vec3 uSun, uSkyZN, uSkyHN, uSkyZD, uSkyMD, uSkyHD, uSunCol, uHaze;
vec3 rvSkyBase(vec3 d,float sun){
 d=normalize(d);float up=clamp(d.y,0.0,1.0);
 vec3 night=mix(uSkyHN,uSkyZN,smoothstep(0.12,0.52,up));
 vec2 dh=d.xz/max(length(d.xz),1e-4),sh=normalize(uSun.xz);float toward=0.5+0.5*dot(dh,sh);
 vec3 hor=mix(uSkyMD,uSkyHD,pow(toward,2.2)*(1.0-smoothstep(0.0,0.16,up)));
 vec3 dawn=mix(hor,uSkyZD,smoothstep(mix(0.02,0.24,toward),mix(0.5,0.95,toward),up));
 float cs=dot(d,uSun);
 dawn+=uSunCol*sun*(smoothstep(0.999935,0.99996,cs)*5.0+pow(max(cs,0.0),9000.0)*0.45+pow(max(cs,0.0),160.0)*0.16*(1.0-up));
 vec3 c=mix(night,dawn,uDawn);
 return mix(c,mix(uSkyHN*0.7,uHaze*0.8,uDawn),smoothstep(0.0,-0.06,d.y));
}
vec3 rvSky(vec3 d){return rvSkyBase(d,1.0);}
// What a surface reflects near the horizon: the estate and the neighbours in haze, then sky.
vec3 rvSkyEnv(vec3 d){return mix(mix(uSkyHN*0.45,mix(uHaze,uSkyZD,0.6)*0.42,uDawn),rvSkyBase(d,0.0),smoothstep(-0.04,0.16,normalize(d).y));}`;
const RV_SHAPE_GLSL=`
float rvInside(vec3 P){return (1.0-smoothstep(11.0,11.3,abs(P.x)))*smoothstep(-7.8,-8.3,P.z)*(1.0-smoothstep(10.15,10.4,P.y));}
float rvFall(float d,float r){float x=d/r;return 1.0/(1.0+x*x);}
float rvWin(float d,float range){float x=clamp(d/range,0.0,1.0);x=1.0-x*x*x*x;return x*x;}
// The red spill: a triangle on the apron, apex at the threshold (z -7.7), 9 m base 14 m out.
float rvRedWedge(vec3 P,float amt){
 float d=P.z+7.7;if(d<0.0||amt<=0.0)return 0.0;
 float hw=0.06+amt*4.5*d/14.0,soft=0.05+0.035*d;
 return (1.0-smoothstep(hw-soft,hw+soft,abs(P.x)))*(1.0-smoothstep(12.5,15.0,d))*smoothstep(0.0,0.05,amt)*smoothstep(-0.05,0.25,d);
}
// First light thrown back in: the rhyming triangle inside, apex at the threshold, opening into the hall.
float rvDawnWedge(vec3 P,float amt){
 float d=-7.7-P.z;if(d<0.0||amt<=0.0)return 0.0;
 float axis=-0.12*d,hw=0.25+amt*4.6*d/14.0,soft=0.12+0.05*d;
 float core=1.0-smoothstep(hw-soft,hw+soft,abs(P.x-axis));
 return (core+0.10*(1.0-smoothstep(hw,hw+4.0,abs(P.x-axis))))*(1.0-smoothstep(17.0,26.0,d))*smoothstep(0.0,0.08,amt);
}
vec3 rvSeg(vec3 P,vec3 a,vec3 b){vec3 ab=b-a;float t=clamp(dot(P-a,ab)/dot(ab,ab),0.0,1.0);return a+ab*t;}
float rvHash(float n){return fract(sin(n)*43758.5453);}
float rvNoise1(float x){float i=floor(x),f=fract(x);f=f*f*(3.0-2.0*f);return mix(rvHash(i),rvHash(i+1.0),f);}
// Black water streaks hanging 0.3-1.5 m under a ledge.
float rvStreak(float x,float below){
 float n=rvNoise1(x*9.0)*0.6+rvNoise1(x*2.3+7.0)*0.4,len=0.3+1.2*rvNoise1(x*1.7+3.1);
 return smoothstep(0.42,0.8,n)*(1.0-smoothstep(len*0.3,len,below))*step(0.0,below);
}`;
function rvV3(a){return `vec3(${a.map(n=>(+n).toFixed(3)).join(',')})`;}
function rvEnvFragmentLights(){const R=RV_RIG;return `
{
 vec3 P=vRVEnvPosition;float rvIn=rvInside(P),rvOut=1.0-rvIn;
 // Interior skylight is mostly blocked by the roof; the doorway lets some in.
 irradiance*=mix(1.0,mix(mix(0.72,0.14,uDawn),0.8,smoothstep(-15.0,-8.0,P.z)),rvIn);
 // Yard sodium once the key has turned into the sun (fills in until the lamp switches off).
 if(uSodRes>0.0&&rvOut>0.0){vec3 L=uSodPos-P;float d=length(L);rvAdd(L,uSodCol*uSodRes*rvFall(d,${R.sodium.radius.toFixed(2)})*smoothstep(-0.05,0.35,L.y/d)*rvOut,geometry,material,reflectedLight);}
 // Road sodium across the street.
 if(uRoad>0.0&&rvOut>0.0){vec3 L=uRoadPos-P;float d=length(L);rvAdd(L,uSodCol*uRoad*rvFall(d,${R.road.radius.toFixed(2)})*smoothstep(-0.05,0.35,L.y/d)*rvOut,geometry,material,reflectedLight);}
 // Left sconce: a caged down-light on the pier.
 if(uSconce>0.0&&rvOut>0.0){vec3 L=${rvV3(R.sconce.pos)}-P;float d=length(L);if(d<7.0)rvAdd(L,uSconceCol*uSconce*rvFall(d,${R.sconce.radius.toFixed(2)})*rvWin(d,7.0)*smoothstep(-0.15,0.55,L.y/d),geometry,material,reflectedLight);}
 // Glow sign: lambertian emitter facing +z, nearest point on its face.
 if(uSign>0.0&&P.z>-7.11){vec3 C=clamp(P,${rvV3(R.sign.min)},${rvV3(R.sign.max)});vec3 L=C-P;float d=max(length(L),0.05);if(d<9.0)rvAdd(L,uSignCol*uSign*rvFall(d,${R.sign.radius.toFixed(2)})*rvWin(d,9.0)*clamp((P.z+7.1)/d,0.0,1.0),geometry,material,reflectedLight);}
 // The seam and the line under the door: red, short, only at the door edges and the step.
 if(uSeam*uRed>0.0&&P.z>-7.78&&rvOut>0.0){
  vec3 L=rvSeg(P,vec3(0.0,0.3,-7.62),vec3(0.0,8.9,-7.62))-P;float d=length(L);if(d<2.0)rvAdd(L,uRedCol*uSeam*rvFall(d,${R.seam.radius.toFixed(2)})*rvWin(d,2.0),geometry,material,reflectedLight);
  L=rvSeg(P,vec3(-3.95,0.26,-7.58),vec3(3.95,0.26,-7.58))-P;d=length(L);if(d<1.6)rvAdd(L,uRedCol*uSeam*rvFall(d,0.32)*rvWin(d,1.6),geometry,material,reflectedLight);}
 // The open doorway: red within 6 m of it (door leaves, jambs, step, bollards). The floor uses the wedge instead.
 if(uSpill*uRed>0.0&&P.z>-7.95&&rvOut>0.0){
  #ifdef RV_FLOOR
  float w=rvRedWedge(P,uSpill);if(w>0.0){vec3 L=vec3(clamp(P.x*0.3,-1.2,1.2),2.6,-8.4)-P;rvAdd(L,uRedCol*uSpill*uRed*${R.spill.intensity.toFixed(2)}*w,geometry,material,reflectedLight);}
  #else
  vec3 L=vec3(clamp(P.x,-3.6,3.6),clamp(P.y,0.5,8.4),-8.3)-P;float d=length(L);if(d<6.0)rvAdd(L,uRedCol*uSpill*uRed*${R.spill.glow.toFixed(2)}*rvFall(d,1.4)*rvWin(d,6.0),geometry,material,reflectedLight);
  #endif
 }
 if(rvIn>0.0){
  // Red back wash behind the stacks (range 16 m), the booth tube as a rim, the warm booth practicals.
  if(uBack>0.0){vec3 L=rvSeg(P,${rvV3(R.back.a)},${rvV3(R.back.b)})-P;float d=length(L);if(d<${R.back.range.toFixed(1)})rvAdd(L,uRedCol*uBack*rvWin(d,${R.back.range.toFixed(1)})/(1.0+d*d*0.07)*smoothstep(-2.5,0.8,L.z)*rvIn,geometry,material,reflectedLight);}
  if(uBack>0.0){vec3 L=${rvV3(R.back.bounce)}-P;float d=length(L);if(d<9.0)rvAdd(L,uRedCol*uBack*0.05*rvFall(d,3.0)*rvWin(d,9.0)*rvIn,geometry,material,reflectedLight);}
  if(uTube>0.0){vec3 L=rvSeg(P,${rvV3(R.tube.a)},${rvV3(R.tube.b)})-P;float d=length(L);if(d<${R.tube.range.toFixed(1)})rvAdd(L,uRedCol*uTube*rvFall(d,1.6)*rvWin(d,${R.tube.range.toFixed(1)})*rvIn,geometry,material,reflectedLight);}
  if(uLamp>0.0){vec3 L=${rvV3(R.lamp.pos)}-P;float d=length(L);if(d<${R.lamp.range.toFixed(1)})rvAdd(L,uLampCol*uLamp*rvFall(d,0.45)*rvWin(d,${R.lamp.range.toFixed(1)})*smoothstep(-0.25,0.45,L.y/d)*rvIn,geometry,material,reflectedLight);}
  if(uStrip>0.0){vec3 L=rvSeg(P,${rvV3(R.strip.a)},${rvV3(R.strip.b)})-P;float d=length(L);if(d<${R.strip.range.toFixed(1)})rvAdd(L,uLampCol*uStrip*rvWin(d,${R.strip.range.toFixed(1)})/(0.02+d*d),geometry,material,reflectedLight);}
 }
}`;}
// Key override: the shadowed directional is a point-like sodium pool at night, the sun at dawn.
function rvEnvLightsBegin(){return THREE.ShaderChunk.lights_fragment_begin.replace('getDirectionalLightInfo( directionalLight, geometry, directLight );',
 `getDirectionalLightInfo( directionalLight, geometry, directLight );
 directLight.direction=normalize(mix(normalize((viewMatrix*vec4(uSodPos-vRVEnvPosition,0.0)).xyz),directLight.direction,uKeySun));
 directLight.color*=rvKeyMask(vRVEnvPosition);`);}
function rvEnvHook(sh){
 Object.assign(sh.uniforms,RV_ENV.uniforms);sh.uniforms.uEnvTime=WORLD.uT||RV_ENV.uniforms.uEnvTime;
 const R=RV_RIG;
 sh.vertexShader='varying vec3 vRVEnvPosition;\n#ifdef RV_FLOOR\nuniform mat4 uTextureMatrix;varying vec4 vRVProj;\n#endif\n#ifdef RV_KICK\nuniform float uConeKick;\n#endif\n#ifdef RV_SPIN\nuniform float uEnvTime;\nattribute vec3 rvSpin;\n#endif\n'+sh.vertexShader
  .replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\n#ifdef RV_SPIN\nfloat rvA=uEnvTime*'+(.35*TAU).toFixed(4)+';mat2 rvRot=mat2(cos(rvA),-sin(rvA),sin(rvA),cos(rvA));if(rvSpin.z>0.5)objectNormal.xz=rvRot*objectNormal.xz;\n#endif')
  .replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef RV_KICK\ntransformed.z+=uConeKick;\n#endif\n#ifdef RV_SPIN\nif(rvSpin.z>0.5)transformed.xz=rvSpin.xy+rvRot*(transformed.xz-rvSpin.xy);\n#endif')
  .replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvec4 rvEnvP=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nrvEnvP=instanceMatrix*rvEnvP;\n#endif\nvRVEnvPosition=(modelMatrix*rvEnvP).xyz;\n#ifdef RV_FLOOR\nvRVProj=uTextureMatrix*vec4(vRVEnvPosition,1.0);\n#endif');
 sh.fragmentShader='varying vec3 vRVEnvPosition;\n#ifdef RV_FLOOR\nuniform sampler2D uReflection;uniform float uLive;varying vec4 vRVProj;\n#endif\nuniform float uKeySun,uSpill,uDawnSpill,uRed,uSodium,uSodRes,uRoad,uSeam,uTube,uBack,uLamp,uStrip,uSconce,uSign;\nuniform vec3 uSodPos,uRoadPos,uSodCol,uRedCol,uSconceCol,uSignCol,uLampCol;\n'+RV_SKY_GLSL+RV_SHAPE_GLSL+`
float rvKeyMask(vec3 P){
 vec3 L=uSodPos-P;float d=length(L);
 float sod=rvFall(d,${R.sodium.radius.toFixed(2)})*smoothstep(-0.05,0.35,L.y/d);
 return mix(mix(sod,1.0,uKeySun),0.3*uKeySun*rvDawnWedge(P,uDawnSpill),rvInside(P));
}
`+sh.fragmentShader
  .replace('#include <lights_physical_pars_fragment>','#include <lights_physical_pars_fragment>\nvoid rvAdd(vec3 toLight,vec3 color,const in GeometricContext g,const in PhysicalMaterial m,inout ReflectedLight rl){IncidentLight l;l.direction=normalize((viewMatrix*vec4(toLight,0.0)).xyz);l.color=color;l.visible=true;RE_Direct(l,g,m,rl);}')
  .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
 vec3 rvP=vRVEnvPosition;vec3 rvNg=inverseTransformDirection(normalize(vNormal),viewMatrix);float rvWedgeLit=0.0,rvWet=0.0;
#ifdef RV_FLOOR
 {float ext=smoothstep(-7.95,-7.6,rvP.z);
  float shelter=(1.0-smoothstep(5.0,5.6,abs(rvP.x)))*(1.0-smoothstep(-4.75,-4.35,rvP.z))*ext;
  float drip=(1.0-smoothstep(0.0,0.4,abs(rvP.z+4.42)))*(1.0-smoothstep(5.0,5.4,abs(rvP.x)))*ext;
  float road=smoothstep(17.45,17.55,rvP.z)*(1.0-smoothstep(21.45,21.55,rvP.z));
  float lane=(1.0-ext)*(1.0-smoothstep(1.3,2.4,abs(rvP.x)))*smoothstep(-8.6,-11.5,rvP.z)*(1.0-smoothstep(-30.5,-31.2,rvP.z));
  float wet=max(ext*(0.9-0.6*shelter),drip);rvWet=max(wet,lane*0.6);
  diffuseColor.rgb*=mix(1.0,0.3,wet);
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.018,0.018,0.017),road);
  diffuseColor.rgb*=mix(1.0,0.86,lane);
  roughnessFactor=mix(roughnessFactor,0.2+0.14*(1.0-roughnessFactor),wet);
  roughnessFactor=mix(roughnessFactor,0.3,lane);
  rvWedgeLit=rvRedWedge(rvP,uSpill)*uSpill*uRed;}
#endif
#ifdef RV_CONCRETE
 {float front=smoothstep(0.6,0.8,rvNg.z)*step(-8.62,rvP.z)*step(abs(rvP.x),16.3);
  float s=max(rvStreak(rvP.x,13.75-rvP.y),rvStreak(rvP.x+17.0,2.40-rvP.y));
  s=max(s,rvStreak(rvP.x+5.0,8.2-rvP.y)*step(11.0,abs(rvP.x))*(1.0-step(15.0,abs(rvP.x))));
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.025,0.024,0.02),s*front*0.7);
  float splash=(1.0-smoothstep(0.28,0.42,rvP.y+0.05*sin(rvP.x*5.1)+0.03*sin(rvP.x*13.0)))*step(-8.62,rvP.z);
  diffuseColor.rgb*=mix(1.0,0.55,splash*(1.0-rvInside(rvP)));roughnessFactor=mix(roughnessFactor,0.6,splash);}
#endif
#ifdef RV_STRUCT
 {float top=smoothstep(0.7,0.9,rvNg.y);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.10,0.095,0.085),top*0.55);roughnessFactor=mix(roughnessFactor,0.9,top);}
#endif
`)
  .replace('#include <lights_fragment_begin>',rvEnvLightsBegin()+rvEnvFragmentLights())
  .replace('#include <lights_fragment_end>',`{vec3 rvN=inverseTransformDirection(geometry.normal,viewMatrix),rvV=normalize(cameraPosition-vRVEnvPosition),rvR=reflect(-rvV,rvN);
  float rvRg=smoothstep(0.08,0.62,material.roughness);
  vec3 rvBlur=rvSkyBase(normalize(rvN+vec3(0.0,1.3,0.0)),0.0);rvBlur=mix(rvBlur,vec3(dot(rvBlur,vec3(0.2126,0.7152,0.0722))),0.7);
  vec3 rvEnvRad=mix(rvSkyEnv(rvR),rvBlur,rvRg)*mix(1.0,0.03,rvInside(vRVEnvPosition));
#ifdef RV_FLOOR
  rvEnvRad=mix(rvEnvRad,vec3(dot(rvEnvRad,vec3(0.2126,0.7152,0.0722))),0.5*(1.0-uDawn));
#endif
#ifdef RV_FLOOR
  float rvPlanar=0.0;
  if(uLive>0.5&&rvWet>0.0){vec2 ruv=vRVProj.xy/max(vRVProj.w,1e-4);float sp=0.004+material.roughness*0.05;
   vec3 acc=texture2D(uReflection,ruv).rgb*0.36+(texture2D(uReflection,ruv+vec2(0.0,sp)).rgb+texture2D(uReflection,ruv-vec2(0.0,sp)).rgb)*0.22+(texture2D(uReflection,ruv+vec2(0.0,2.2*sp)).rgb+texture2D(uReflection,ruv-vec2(0.0,2.2*sp)).rgb)*0.10;
   rvPlanar=rvWet*step(0.0,vRVProj.w)*(1.0-smoothstep(0.96,1.0,abs(ruv.x*2.0-1.0)))*(1.0-smoothstep(0.96,1.0,abs(ruv.y*2.0-1.0)));acc=mix(acc,vec3(dot(acc,vec3(0.2126,0.7152,0.0722))),0.6+0.15*uDawn);rvEnvRad=mix(rvEnvRad,acc,rvPlanar);}
  // The seam and the line under the door, seen in the wet: a red streak toward the viewer (sub-texel in the capture).
  if(uSeam*uRed>0.0&&rvR.z<-0.01&&vRVEnvPosition.z>-7.5){vec3 P1=vRVEnvPosition;float t=(-7.62-P1.z)/rvR.z;vec3 H=P1+rvR*t;float w=0.03+material.roughness*0.05*t;
   float line=(1.0-smoothstep(w*0.4,w,abs(H.x)))*step(0.27,H.y)*step(H.y,8.9)+(1.0-smoothstep(0.015,0.015+material.roughness*0.01*t,abs(H.y-0.26)))*step(abs(H.x),3.95);
   rvEnvRad+=uRedCol*uSeam*uRed*line*rvWet*1.1*min(1.0,0.06/w);}
#endif
  radiance+=rvEnvRad;
#ifdef RV_FLOOR
  if(rvPlanar<0.5&&uBack>0.0&&rvR.z<-0.02&&rvInside(vRVEnvPosition)>0.5){vec3 P0=vRVEnvPosition;float t=(-44.1-P0.z)/rvR.z;vec3 H=P0+rvR*t;
   if(abs(H.x)<11.0&&H.y<10.0){vec3 Lw=rvSeg(H,${rvV3(RV_RIG.back.a)},${rvV3(RV_RIG.back.b)})-H;float dw=length(Lw);
    float ts=(-35.2-P0.z)/rvR.z;vec3 S=P0+rvR*ts;float occ=step(2.6,abs(S.x))*step(abs(S.x),5.9)*step(S.y,6.95);
    vec3 T=P0+rvR*((-36.62-P0.z)/rvR.z);float tube=(1.0-smoothstep(2.6,2.8,abs(T.x)))*exp(-pow((T.y-7.1)/0.22,2.0));
    radiance+=uRedCol*(uBack*0.16*(Lw.z/max(dw,0.1))/(1.0+dw*dw*0.07)*(1.0-occ)+uTube*0.12*tube)*0.55*(1.0-smoothstep(0.2,2.3,abs(P0.x)));}}
#endif
  }
#include <lights_fragment_end>`)
  .replace('#include <output_fragment>',`float rvAO=rvNg.y>0.9?1.0:mix(0.62,1.0,smoothstep(0.0,0.9,rvP.y));
 outgoingLight*=rvAO;
#ifdef RV_SPIN
 outgoingLight=mix(outgoingLight,uHaze*1.0,(1.0-exp(-length(cameraPosition-rvP)*0.02))*uDawn*0.84);
#endif
 outgoingLight+=uRedCol*rvWedgeLit*${(R.spill.intensity*.13).toFixed(3)};
#include <output_fragment>`);
}
// Emissive practicals that follow a uniform at render time (so a later multiplier lands).
function rvEnvEmissive(material,name,base){
 material.onBeforeCompile=sh=>{sh.uniforms[name]=RV_ENV.uniforms[name];sh.fragmentShader='uniform float '+name+';\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb*='+name+'/'+base.toFixed(3)+';');};
 material.customProgramCacheKey=()=>'rv-emissive-'+name;material.needsUpdate=true;
}
function rvEnvMaterials(){
 // One shared hook for every standard material; defines select the surface family.
 const seen=new Set();
 scene.traverse(o=>{const list=Array.isArray(o.material)?o.material:[o.material];for(const m of list){if(!m||!m.isMeshStandardMaterial||seen.has(m))continue;seen.add(m);m.onBeforeCompile=rvEnvHook;m.needsUpdate=true;RV_ENV.stats.hooked++;}});
 // Seam and under-door line follow uSeam; the tube follows uTube.
 const seam=new THREE.MeshBasicMaterial({color:RV_ENV.redOn.clone(),toneMapped:false});rvEnvEmissive(seam,'uSeam',RV_ENV.base.seam);RV.seam.material=seam;RV.underDoor.material=seam;
 const tube=new THREE.MeshBasicMaterial({color:RV_ENV.redOn.clone(),toneMapped:false});rvEnvEmissive(tube,'uTube',RV_ENV.base.tube);RV.signals.forEach(m=>m.material=tube);
 mats.red.dispose();
}
function rvEnvInfrastructure(){
 const hardware=[],duct=[],darkwork=[];
 // Deep roof purlins, corrugated end laps, bolted knee brackets, tie rods.
 for(let z=-10;z>-44;z-=2){rvEnvBox(duct,21.5,.11,.10,0,9.89,z);}
 for(const x of [-10,10])for(let z=-12;z>=-42;z-=5){
  rvEnvBox(hardware,.72,.5,.075,x,9.4,z+.25);rvEnvBox(darkwork,.11,1.65,.11,x*.94,8.94,z,0,x<0?-.68:.68);
  for(const dx of [-.22,.22])for(const y of [9.27,9.52])rvEnvBox(duct,.06,.06,.04,x+dx,y,z+.30);
 }
 // Suspended rectangular supply duct follows the left aisle, outside the camera lane.
 for(let z=-13;z>=-38;z-=5){
  rvEnvBox(duct,1.1,.58,4.9,-8.75,8.03,z);rvEnvBox(hardware,1.18,.66,.07,-8.75,8.03,z+2.4);
  for(const x of [-9.34,-8.16])rvEnvBox(hardware,.025,1.52,.025,x,8.92,z);
  rvEnvBox(darkwork,.73,.014,.9,-8.75,7.726,z);
  for(let k=0;k<8;k++)rvEnvBox(hardware,.71,.025,.025,-8.75,7.705,z-.4+k*.115);
 }
 // Exterior box gutter under the coping; downpipe shoes and drain grilles at the two downpipes.
 rvEnvBox(hardware,32,.17,.26,0,13.6,-7.34);
 for(const x of [-9.65,9.65]){
  rvEnvBox(duct,.25,.22,.28,x,.17,-7.1);rvEnvBox(darkwork,.22,.09,.025,x,.19,-6.95);
  rvEnvBox(hardware,1.2,.018,.7,x,.025,-6.5);
  for(let k=0;k<12;k++)rvEnvBox(darkwork,.038,.02,.62,x-.52+k*.095,.041,-6.5);
 }
 // Service vent: louver depth, wire guard and feed pipe, on the right (dark) third.
 rvEnvBox(duct,2.28,1.16,.19,11.5,5.6,-7.18);
 rvEnvBox(darkwork,2.1,1,.025,11.5,5.6,-7.07);
 for(let k=0;k<12;k++)rvEnvBox(hardware,2.07,.045,.16,11.5,5.15+k*.082,-7.01,-.25);
 // Mezzanine stair runs against the right wall; never enters the camera lane.
 for(let k=0;k<16;k++){
  const y=.18+k*.33,z=-17.8-k*.43;
  rvEnvBox(duct,2,.11,.47,9.2,y,z);rvEnvBox(hardware,2,.035,.055,9.2,y+.07,z+.215);
  if(k%3===0)rvEnvBox(hardware,.035,1.1,.035,8.17,y+.6,z);
 }
 rvEnvBox(hardware,.045,8.5,.045,8.17,3.24,-21.02,.916);
 // Concrete service channel and cable tray kept low on left wall.
 rvEnvBox(darkwork,.19,.24,30,-10.73,.22,-27);
 for(let z=-12;z>-42;z-=.7)rvEnvBox(hardware,.65,.026,.035,-10.42,6.6,z);
 rvEnvBox(hardware,.05,.1,30,-10.1,6.64,-27);
 rvEnvBatch(duct,mats.steel);rvEnvBatch(hardware,mats.edge);rvEnvBatch(darkwork,mats.dark);
}
// The single-draw sky: skyglow at night, dawn gradient, haze and a ~1.2 degree sun disc.
function rvEnvSky(){
 const U=RV_ENV.uniforms,mat=rvEnvOwn(new THREE.ShaderMaterial({uniforms:{uDawn:U.uDawn,uSun:U.uSun,uSkyZN:U.uSkyZN,uSkyHN:U.uSkyHN,uSkyZD:U.uSkyZD,uSkyMD:U.uSkyMD,uSkyHD:U.uSkyHD,uSunCol:U.uSunCol,uHaze:U.uHaze},
  vertexShader:'varying vec3 vDir;void main(){vDir=position;vec4 p=projectionMatrix*vec4(mat3(viewMatrix)*position,1.0);gl_Position=p.xyww;}',
  fragmentShader:RV_SKY_GLSL+'\nvarying vec3 vDir;void main(){gl_FragColor=vec4(rvSky(vDir),1.0);}',
  side:THREE.BackSide,depthWrite:false,fog:false}));
 const sky=new THREE.Mesh(rvEnvOwn(new THREE.SphereGeometry(1,32,16)),mat);sky.frustumCulled=false;sky.renderOrder=-10;scene.add(sky);RV_ENV.sky=sky;
}
function rvEnvPuddles(){
 const U=RV_ENV.uniforms;
 const material=rvEnvOwn(new THREE.ShaderMaterial({
  uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{}]),
  transparent:true,depthWrite:false,fog:true,
  vertexShader:`uniform mat4 uTextureMatrix;attribute vec2 rvLocal;varying vec4 vProjected;varying vec3 vWorld;varying vec2 vLocal;
   #include <fog_pars_vertex>
   void main(){vec4 p=modelMatrix*vec4(position,1.0);vWorld=p.xyz;vLocal=rvLocal;vProjected=uTextureMatrix*p;vec4 mvPosition=viewMatrix*p;gl_Position=projectionMatrix*mvPosition;
   #include <fog_vertex>
   }`,
  fragmentShader:`uniform sampler2D uReflection;uniform float uLive,uEnvTime,uSpill,uSeam,uRed;uniform vec3 uRedCol;
   varying vec4 vProjected;varying vec3 vWorld;varying vec2 vLocal;
   ${RV_SKY_GLSL}${RV_SHAPE_GLSL}
   #include <fog_pars_fragment>
   void main(){
    vec3 V=normalize(cameraPosition-vWorld);
    vec2 ripple=vec2(sin(vWorld.z*9.0+uEnvTime*.31)+sin(vWorld.x*5.3-uEnvTime*.47),cos(vWorld.x*11.0-uEnvTime*.23)+cos(vWorld.z*6.1+uEnvTime*.37))*.0007;
    float fres=0.04+0.96*pow(1.0-clamp(V.y,0.0,1.0),5.0);
    vec2 uv=vProjected.xy/max(vProjected.w,.0001)+ripple;
    float valid=step(0.0,uv.x)*step(uv.x,1.0)*step(0.0,uv.y)*step(uv.y,1.0)*step(0.0,vProjected.w);
    vec3 R=reflect(-V,normalize(vec3(ripple.x*30.0,1.0,ripple.y*30.0)));
    float inside=rvInside(vWorld);
    vec3 fallback=rvSky(R)*mix(1.0,0.02,inside);
    // The open doorway and the seam seen in the wet: red, only near their sources.
    fallback+=uRedCol*uRed*(uSpill*2.2*rvRedWedge(vWorld,uSpill)+uSeam*0.5*exp(-abs(vWorld.x)*6.0)*exp(-max(vWorld.z+7.6,0.0)*0.35))*(1.0-inside);
    vec3 reflected=texture2D(uReflection,clamp(uv,vec2(.002),vec2(.998))).rgb;
    vec3 color=mix(fallback,reflected,uLive*valid);
    float edge=1.0-smoothstep(.62,1.0,length(vLocal));
    gl_FragColor=vec4(color,(0.35+0.6*fres)*edge);
    #include <fog_fragment>
   }`
 }));
 for(const k of ['uReflection','uTextureMatrix','uLive','uEnvTime','uSpill','uSeam','uRed','uRedCol','uDawn','uSun','uSkyZN','uSkyHN','uSkyZD','uSkyMD','uSkyHD','uSunCol','uHaze'])material.uniforms[k]=k==='uEnvTime'?(WORLD.uT||U.uEnvTime):U[k];
 RV_ENV.puddleMaterial=material;
 // Low spots: downpipe shoes, the canopy drip line, the wedge, the kerb, and two roof leaks inside.
 const sites=[[2.2,2.6,2.1,.8],[-3.6,-.4,1.3,.5],[6.8,8.6,2.7,.8],[-8,6,1.8,.7],[-9.6,-5.6,1.35,.55],[9.6,-5.8,1.3,.46],
  [-2.2,-4.3,.9,.38],[1.7,-4.35,.75,.32],[-5,19.4,2.2,.6],[7.4,20.1,1.8,.5],[-7.5,-14,1.8,.65],[6.9,-29,1.7,.48]];
 const parts=[];
 for(const [x,z,sx,sz] of sites){const shape=new THREE.Shape(),rand=mulberry32(91+Math.abs(Math.round(x*13+z*7)));
  for(let k=0;k<20;k++){const a=k/20*TAU,r=.77+rand()*.23;k?shape.lineTo(Math.cos(a)*r,Math.sin(a)*r):shape.moveTo(Math.cos(a)*r,Math.sin(a)*r);}
  shape.closePath();const g=new THREE.ShapeGeometry(shape);const local=new Float32Array(g.attributes.position.count*2);
  for(let i=0;i<g.attributes.position.count;i++){local[i*2]=g.attributes.position.getX(i);local[i*2+1]=g.attributes.position.getY(i);}
  g.setAttribute('rvLocal',new THREE.BufferAttribute(local,2));g.scale(sx,sz,1);g.rotateX(-Math.PI/2);g.translate(x,RV_ENV_CONFIG.reflection.floorY,z);parts.push(g);
  RV_ENV.puddles.push({x,z,sx,sz});}
 const geo=rvEnvOwn(rvEnvMergeAttrs(parts,['position','rvLocal']));
 const mesh=new THREE.Mesh(geo,material);mesh.frustumCulled=false;mesh.renderOrder=2;scene.add(mesh);RV_ENV.puddleMesh=mesh;
 // A one-pixel owned fallback keeps sampler completeness on WebGL1 before the first capture.
 const data=new Uint8Array([11,10,9,255]);const fallback=rvEnvOwn(new THREE.DataTexture(data,1,1,THREE.RGBAFormat));fallback.needsUpdate=true;
 material.uniforms.uReflection.value=fallback;
}
function rvEnvMergeAttrs(list,names){let vN=0,iN=0;list.forEach(g=>{vN+=g.attributes.position.count;iN+=g.index?g.index.count:g.attributes.position.count;});
 const out=new THREE.BufferGeometry(),arrays={};for(const n of names)arrays[n]=new Float32Array(vN*list[0].attributes[n].itemSize);
 const idx=vN>65535?new Uint32Array(iN):new Uint16Array(iN);let vo=0,io=0;
 for(const g of list){for(const n of names)arrays[n].set(g.attributes[n].array,vo*g.attributes[n].itemSize);const gi=g.index?g.index.array:[...Array(g.attributes.position.count).keys()];for(let i=0;i<gi.length;i++)idx[io+i]=gi[i]+vo;io+=gi.length;vo+=g.attributes.position.count;g.dispose();}
 for(const n of names)out.setAttribute(n,new THREE.BufferAttribute(arrays[n],list[0].attributes[n].itemSize));out.setIndex(new THREE.BufferAttribute(idx,1));out.computeBoundingSphere();return out;}
// Two canopy drip rings, one every 1.6 s, growing to 25 cm, on the drip-line puddles. Driven by WORLD.uT.
function rvEnvDrips(){
 if(!RV_ENV_CONFIG.drips.enabled||LOW)return;
 const quad=(x,z,ph)=>{const g=new THREE.PlaneGeometry(.62,.62).rotateX(-Math.PI/2).translate(x,RV_ENV_CONFIG.reflection.floorY+.004,z);const a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<g.attributes.position.count;i++){a[i*3]=x;a[i*3+1]=z;a[i*3+2]=ph;}g.setAttribute('rvDrip',new THREE.BufferAttribute(a,3));return g;};
 const geo=rvEnvOwn(rvEnvMergeAttrs([quad(-2.25,-4.3,0),quad(1.65,-4.36,.8)],['position','rvDrip']));
 const mat=rvEnvOwn(new THREE.ShaderMaterial({uniforms:{uEnvTime:WORLD.uT||RV_ENV.uniforms.uEnvTime,uDripCol:{value:new THREE.Color()}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:'attribute vec3 rvDrip;varying vec3 vDrip;varying vec2 vXZ;void main(){vDrip=rvDrip;vec4 p=modelMatrix*vec4(position,1.0);vXZ=p.xz;gl_Position=projectionMatrix*viewMatrix*p;}',
  fragmentShader:`uniform float uEnvTime;uniform vec3 uDripCol;varying vec3 vDrip;varying vec2 vXZ;
   void main(){float t=fract((uEnvTime+vDrip.z)/${RV_ENV_CONFIG.drips.period.toFixed(2)});float r=length(vXZ-vDrip.xy),rad=${RV_ENV_CONFIG.drips.radius.toFixed(2)}*sqrt(t);
   float ring=exp(-pow((r-rad)/0.012,2.0))*(1.0-t)*(1.0-t);gl_FragColor=vec4(uDripCol*ring,1.0);}`}));
 const mesh=new THREE.Mesh(geo,mat);mesh.frustumCulled=false;mesh.renderOrder=3;scene.add(mesh);RV_ENV.drips=mesh;
}
function rvEnvFog(){
 if(!RV_ENV_CONFIG.fog.enabled)return;
 const c=cvs(128,128),ctx=c.getContext('2d'),r=mulberry32(273);
 ctx.clearRect(0,0,128,128);
 for(let i=0;i<24;i++){const x=26+r()*76,y=26+r()*76,radius=12+r()*31,g=ctx.createRadialGradient(x,y,0,x,y,radius);g.addColorStop(0,'rgba(210,204,187,.11)');g.addColorStop(1,'rgba(210,204,187,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);}
 const texture=rvEnvOwn(tx(c)),geo=rvEnvOwn(new THREE.PlaneGeometry(1,1));
 // Vent and downpipe steam, plus the interior duct outlet. Tinted by the light where they hang.
 const sites=[{p:[11.5,5.6,-6.9],s:[2.6,1.35],drift:[-.22,.12,.55],lit:'ext'},
  {p:[-9.65,.43,-6.9],s:[2.1,.8],drift:[.75,.10,.25],lit:'sod'},
  {p:[9.65,.4,-6.9],s:[1.6,.65],drift:[-.65,.12,.30],lit:'ext'},
  {p:[-8.75,7.5,-23],s:[2.7,1.5],drift:[.4,-.28,.12],lit:'hall'}];
 const layers=LOW||COARSE?2:3;
 sites.forEach((site,index)=>{for(let layer=0;layer<layers;layer++){
  const mat=rvEnvOwn(new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:0,depthWrite:false,depthTest:true,color:0xffffff,side:THREE.DoubleSide}));
  const mesh=new THREE.Mesh(geo,mat);mesh.renderOrder=3;scene.add(mesh);
  RV_ENV.fog.push({mesh,site,index,phase:layer/layers});
 }});
}
function rvEnvConsolidate(){
 if(!RV_ENV_CONFIG.consolidate)return;
 const skip=new Set([RV.seam,RV.underDoor,...RV.signals]),groups=new Map();
 for(const mesh of scene.children.slice()){
  if(!mesh.isMesh||mesh.geometry!==RVBOX||skip.has(mesh)||!mesh.visible)continue;
  const key=mesh.material.uuid+':'+mesh.castShadow+':'+mesh.receiveShadow;
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(mesh);
 }
 for(const list of groups.values()){
  if(list.length<2)continue;
  const first=list[0],batch=new THREE.InstancedMesh(RVBOX,first.material,list.length);
  batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;
  // The vendored legacy renderer does not compute InstancedMesh bounds; these room-spanning groups must not cull.
  batch.frustumCulled=false;
  list.forEach((mesh,index)=>{mesh.updateMatrix();batch.setMatrixAt(index,mesh.matrix);scene.remove(mesh);});
  batch.instanceMatrix.needsUpdate=true;scene.add(batch);RV_ENV.batches.push(batch);
  RV_ENV.stats.consolidated+=list.length;RV_ENV.stats.batches++;
 }
}
// Only large forms and emitters appear in the planar capture; details stay on layer 3.
function rvEnvReflectLayers(){
 const keep=new Set([...RV.signals,RV.facadePaint,RV_ENV.sky,WORLD.floor,RV.logo,RV.seam,RV.underDoor,RV.sconce,RV.sodiumHead,RV.roadHead,RV.roofSheets,RV.estate,...RV.notices,...RV.doors.map(d=>d.leaf)]);
 const big=new Set([mats.concrete,mats.galv,mats.alu,mats.glass]);
 camera.layers.enable(3);if(WORLD.key?.shadow)WORLD.key.shadow.camera.layers.enable(3);
 scene.traverse(o=>{if(!o.isMesh)return;if(keep.has(o)||(big.has(o.material)&&!o.isInstancedMesh)){RV_ENV.stats.reflected++;return;}o.layers.set(3);});
 WORLD.floor.layers.set(3);
}
function rvEnvUpdate(){
 const E=RV_ENV,U=E.uniforms,p=RIG.smooth,C=RV_CONFIG,time=WORLD.uT.value,dawn=U.uDawn.value;
 U.uEnvTime.value=time;
 /* PROVISIONAL spill envelopes, owned by the Motion choreographer once choreography.js
    writes uSpill/uDawnSpill in its own (later) updateWorld wrapper. Pure functions of RIG.smooth:
    uSpill reaches .8 by .55 and 1 by .80 (monotone Hermite through the RV_CONFIG.spill window), x (1 - dawn). */
 U.uSpill.value=rvEnvSpillEnvelope(p)*(1-dawn);
 U.uDawnSpill.value=smooth(...C.dawnSpill,p);
 // Steam takes the colour of the light it hangs in: sodium-dim at night, warm haze at dawn, near-black in the hall.
 for(const item of E.fog){
  const {mesh,site,phase,index}=item,cycle=(time*RV_ENV_CONFIG.fog.speed+phase+index*.17)%1;
  mesh.position.set(site.p[0]+site.drift[0]*cycle,site.p[1]+site.drift[1]*cycle,site.p[2]+site.drift[2]*cycle);
  mesh.scale.set(site.s[0]*(.65+cycle*.8),site.s[1]*(.7+cycle*.5),1);
  mesh.quaternion.copy(camera.quaternion);
  const base=LOW||COARSE?RV_ENV_CONFIG.fog.mobileOpacity:RV_ENV_CONFIG.fog.opacity,light=site.lit==='hall'?.05+.25*dawn:site.lit==='sod'?.22+.8*dawn:.07+.9*dawn;
  mesh.material.color.setRGB(light,light*.93,light*.84);
  mesh.material.opacity=base*Math.sin(cycle*Math.PI);
  mesh.visible=PERF.scale>.61||index<2;
 }
 if(E.drips){const k=.08+.5*dawn;E.drips.material.uniforms.uDripCol.value.setRGB(k*1.0,k*.82,k*.62).lerp(E.uniforms.uSkyMD.value,dawn*.5);}
}
// Monotone cubic through (.38,0) (.55,.8) (.80,1), flat at both ends: ease in and out, no overshoot.
function rvEnvSpillEnvelope(p){const [a,b]=RV_CONFIG.spill,m=a+(b-a)*.405,ya=.8,t=1.37;
 if(p<=a)return 0;if(p>=b)return 1;
 const h=p<m?m-a:b-m,u=(p-(p<m?a:m))/h,u2=u*u,u3=u2*u,y0=p<m?0:ya,y1=p<m?ya:1,m0=p<m?0:t*h,m1=p<m?t*h:0;
 return (2*u3-3*u2+1)*y0+(u3-2*u2+u)*m0+(-2*u3+3*u2)*y1+(u3-u2)*m1;}
function rvEnvReflection(){
 const E=RV_ENV,cfg=RV_ENV_CONFIG.reflection,mat=E.puddleMaterial;
 if(!mat||E.disposed)return;
 E.frame++;
 const allowed=cfg.enabled&&!LOW&&!COARSE&&PERF.scale>=cfg.minScale&&renderer.getRenderTarget&&renderer.setRenderTarget&&renderer.getViewport;
 if(!allowed){mat.uniforms.uLive.value=0;E.mode='procedural';return;}
 if(camera.position.y<cfg.floorY+.1){mat.uniforms.uLive.value=0;E.mode='procedural';return;}
 if(E.reflectionValid&&!RV.paused&&E.frame-E.lastCapture<cfg.every)return;
 const width=renderer.domElement.width||512,height=renderer.domElement.height||512;
 const cap=Math.min(.35,cfg.maxSize/Math.max(width,height));
 const w=Math.max(128,Math.round(width*cap));
 const h=Math.max(128,Math.round(height*cap));
 if(!E.reflection){
  E.reflection=rvEnvOwn(new THREE.WebGLRenderTarget(w,h,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,
   format:THREE.RGBAFormat,type:WANT_POST?THREE.HalfFloatType:THREE.UnsignedByteType,depthBuffer:true,stencilBuffer:false}));
  E.reflectionCamera=new THREE.PerspectiveCamera();E.mirrorDirection=new THREE.Vector3();E.mirrorLook=new THREE.Vector3();
  E.mirrorPlane=new THREE.Plane();E.mirrorClip=new THREE.Vector4();E.mirrorQ=new THREE.Vector4();E.viewport=new THREE.Vector4();E.scissor=new THREE.Vector4();
 }else if(E.reflection.width!==w||E.reflection.height!==h)E.reflection.setSize(w,h);
 const mirror=E.reflectionCamera;
 scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 mirror.copy(camera);mirror.layers.set(0);mirror.position.copy(camera.position);mirror.position.y=2*cfg.floorY-camera.position.y;
 const direction=E.mirrorDirection;camera.getWorldDirection(direction);
 const look=E.mirrorLook.copy(camera.position).add(direction);look.y=2*cfg.floorY-look.y;
 mirror.up.set(0,-1,0);mirror.lookAt(look);mirror.updateMatrixWorld(true);
 mirror.projectionMatrix.copy(camera.projectionMatrix);mirror.matrixWorldInverse.copy(mirror.matrixWorld).invert();
 // Eric Lengyel oblique near-plane projection (same geometry as Three's Reflector).
 const plane=E.mirrorPlane.set(E.mirrorDirection.set(0,1,0),-cfg.floorY).applyMatrix4(mirror.matrixWorldInverse);
 const clip=E.mirrorClip.set(plane.normal.x,plane.normal.y,plane.normal.z,plane.constant),p=mirror.projectionMatrix.elements;
 const q=E.mirrorQ.set((Math.sign(clip.x)+p[8])/p[0],(Math.sign(clip.y)+p[9])/p[5],-1,(1+p[10])/p[14]);
 clip.multiplyScalar(2/clip.dot(q));p[2]=clip.x;p[6]=clip.y;p[10]=clip.z+1-cfg.clipBias;p[14]=clip.w;
 E.textureMatrix.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse);
 const previous=renderer.getRenderTarget(),viewport=renderer.getViewport(E.viewport);
 const scissor=renderer.getScissor?renderer.getScissor(E.scissor):null;
 const scissorTest=renderer.getScissorTest?renderer.getScissorTest():false;
 const shadowUpdate=renderer.shadowMap.autoUpdate;
 if(!E.hiddenList){E.hiddenList=[E.puddleMesh,E.drips,...E.fog.map(f=>f.mesh)].filter(Boolean);E.hiddenWas=E.hiddenList.map(()=>true);}
 const hidden=E.hiddenList,was=E.hiddenWas;for(let i=0;i<hidden.length;i++)was[i]=hidden[i].visible;
 try{
  for(const o of hidden)o.visible=false;renderer.shadowMap.autoUpdate=false;
  renderer.setRenderTarget(E.reflection);if(renderer.setScissorTest)renderer.setScissorTest(false);
  renderer.clear(true,true,false);renderer.render(scene,mirror);
  mat.uniforms.uReflection.value=E.reflection.texture;mat.uniforms.uLive.value=1;
  E.lastCapture=E.frame;E.reflectionValid=true;E.mode='planar';
 }finally{
  for(let i=0;i<hidden.length;i++)hidden[i].visible=was[i];renderer.shadowMap.autoUpdate=shadowUpdate;
  renderer.setRenderTarget(previous);renderer.setViewport(viewport);
  if(scissor&&renderer.setScissor)renderer.setScissor(scissor);if(renderer.setScissorTest)renderer.setScissorTest(scissorTest);
 }
}
RV_ENV.invalidate=function(){RV_ENV.reflectionValid=false;};
RV_ENV.dispose=function(){if(RV_ENV.disposed)return;RV_ENV.disposed=true;for(const r of RV_ENV.resources)r.dispose();RV_ENV.resources.clear();};
const rvEnvBuildShell=buildShell;buildShell=function(){rvEnvBuildShell();rvEnvInfrastructure();rvEnvSky();rvEnvPuddles();rvEnvDrips();};
const rvEnvAtmosphere=rvAtmosphere;rvAtmosphere=function(){rvEnvAtmosphere();
 rvEnvFog();rvEnvConsolidate();rvEnvMaterials();rvEnvReflectLayers();
};
const rvEnvUpdateWorld=updateWorld;updateWorld=function(dt){rvEnvUpdateWorld(dt);rvEnvUpdate();};
const rvEnvRender=render;render=function(){rvEnvReflection();rvEnvRender();};
const rvEnvResize=resize;resize=function(){rvEnvResize();RV_ENV.invalidate();};
