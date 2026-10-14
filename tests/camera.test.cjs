// Camera route (src/ravers/camera.js) against ART-DIRECTION §4 and the Camera director criteria in §6.
// CPU only, real Three math: no browser, GPU or rendering. Geometry is a set of coarse proxies taken
// from docs/environment-notes.md §5, padded outward; tests/ravers-source.test.cjs repeats the
// clearance and sun checks against the real scene triangles.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..');
const THREE_SRC=fs.readFileSync(root+'/dist/landing-pages/secret-pathways-assets/three.min.js','utf8');
const CAMERA_SRC=fs.readFileSync(root+'/src/ravers/camera.js','utf8'),WORLD_SRC=fs.readFileSync(root+'/src/ravers/world.js','utf8');
const num=(re)=>JSON.parse(WORLD_SRC.match(re)[1].replace(/(^|[\[,])(-?)\./g,'$1$20.'));
const TRAVEL=num(/travel:(\[[^\]]+\])/),DOOR=num(/doorOpen:(\[[^\]]+\])/),SUN_EL=num(/sun:\{azimuth:\d+,elevation:(\[[^\]]+\])/),SUN_AZ=+WORLD_SRC.match(/sun:\{azimuth:(\d+)/)[1];
function load({reduce=false,coarse=false}={}){const ctx={console};vm.createContext(ctx);vm.runInContext(THREE_SRC,ctx);
 vm.runInContext(`const RV={},RV_CONFIG={travel:${JSON.stringify(TRAVEL)},doorOpen:${JSON.stringify(DOOR)}},CAM=[],RIG={smooth:0,mx:0,my:0};let REDUCE=${reduce};const COARSE=${coarse};let buildRig=()=>{},fitAspect=()=>{},applyCamera=()=>{};const camera=new THREE.PerspectiveCamera(36,1.6,.35,220);let W=1440,H=900;function vpW(){return W}function vpH(){return H}`,ctx);
 vm.runInContext(CAMERA_SRC+';globalThis.test={RV,RIG,camera,applyCamera,CAM,RV_CONFIG,size:(w,h)=>{W=w;H=h;}};',ctx);return ctx.test;}
const T0=load(),rv=T0.RV.camera;const ctx3={};vm.createContext(ctx3);vm.runInContext(THREE_SRC,ctx3);const T=ctx3.THREE;
const D=180/Math.PI,smooth=(a,b,x)=>{const q=Math.max(0,Math.min(1,(x-a)/(b-a)));return q*q*(3-2*q);};
const travel=r=>{const i=Math.min(4,Math.floor(r));return i+smooth(TRAVEL[0],TRAVEL[1],r-i);};
const ASPECTS=[16/9,1.6,1,.75,9/16,390/844],DESK=[1.6,16/9],PORTRAIT=390/844,POINTERS=[[0,0],[1,1],[-1,-1],[1,-1],[-1,1]];
const KEY=k=>rv.keys.find(x=>x.name===k).s;
let stats={};const note=(k,v)=>stats[k]=v;

// ---------------------------------------------------------------- proxies (metres, padded AABBs)
const B=[ // [x0,y0,z0,x1,y1,z1,tag]
 [-16.3,0,-8.6,-4.23,14.4,-7.35,'facade'],[4.23,0,-8.6,16.3,14.4,-7.35,'facade'],[-4.23,9.04,-8.6,4.23,14.4,-7.35,'facade'],
 [-4.6,0,-8.3,-4.23,9.4,-6.5,'jamb'],[4.23,0,-8.3,4.6,9.4,-6.5,'jamb'],[-5.35,9.28,-8.1,5.35,9.7,-4.4,'canopy'],[-4.45,9.6,-7.65,-4.15,11.55,-6,'stay'],[4.15,9.6,-7.65,4.45,11.55,-6,'stay'],
 [-5.35,10.5,-7.5,5.35,12.3,-7.19,'sign'],[-4.85,0,-8.1,4.85,.26,-5.7,'step'],[-5.15,0,-7.65,5.15,.13,-4.75,'step'],
 [-11.15,0,-3.2,-9.25,8.15,-2.8,'yard pole'],[-5.8,0,-3.8,-5.4,1.15,-3.4,'bollard'],[5.4,0,-3.8,5.8,1.15,-3.4,'bollard'],
 [4.75,0,26.3,6.65,8.85,26.7,'road pole'],[-20,0,17.1,20,.17,17.5,'kerb'],[-20,0,21.4,20,.17,21.8,'kerb'],[-46,0,28.35,46,9.7,62.3,'estate'],
 [20,0,-34.4,27.3,10.9,-5.6,'neighbour'],[-25.9,0,-34.4,-20.4,9.6,-5.6,'neighbour'],
 [-11.2,0,-44.5,-10.8,10.2,-8,'wall'],[10.8,0,-44.5,11.2,10.2,-8,'wall'],[-11.2,0,-44.5,11.2,10.2,-44.1,'back wall'],[-11.2,9.9,-44.5,11.2,10.3,-8,'roof'],
 [-6.95,9.9,-44,6.95,10,-8.5,'roof sheets'],[-8.2,8.75,-42.1,-7.8,9.1,-8.5,'tray'],[7.8,8.75,-42.1,8.2,9.1,-8.5,'tray'],
 [-9.4,7.68,-40.55,-8.1,9.75,-10.45,'duct'],[-5.9,0,-36.45,-2.58,6.85,-35.15,'stack'],[2.58,0,-36.45,5.9,6.85,-35.15,'stack'],
 [-1.28,0,-32.2,1.28,1.52,-31.2,'booth'],[-2.85,6.95,-36.9,2.85,10,-36.5,'tube'],[-3.55,0,-44.15,3.55,6.25,-43.5,'shutter'],
 [7.35,5.35,-32.55,10.65,6.8,-19.25,'mezzanine'],[8.05,0,-24.75,10.3,5.65,-17.45,'stair'],[10.65,5.55,-29.75,10.85,8.65,-28.25,'door'],
 [-.85,9.55,-8.7,.85,10.1,-8.45,'WAY OUT'],[-10.4,-.1,-42.4,10.4,.25,-11.6,'plinths'],[-2.1,0,-35.2,3.9,.95,-32.05,'cables']];
for(let z=-12;z>=-42;z-=5)for(const x of [-10,10]){B.push([x-.3,0,z-.4,x+.3,10,z+.4,'column'],[x-1.15,8.1,z-.35,x+1.15,9.8,z+.35,'knee']);B.push([-10,8.5,z-.25,10,9.75,z+.25,'truss']);}
const FEATURELESS={wall:1,'back wall':1,roof:1,facade:1};
function boxDist(b,p){const dx=Math.max(b[0]-p.x,0,p.x-b[3]),dy=Math.max(b[1]-p.y,0,p.y-b[4]),dz=Math.max(b[2]-p.z,0,p.z-b[5]);return Math.hypot(dx,dy,dz);}
// Door leaves: hinge (side*4,-7.7), leaf 3.96 x 8.65 x .2 plus hardware to +.23, rotated about y by side*open*1.45.
function leafLocal(side,p,v){const open=side<0?smooth(DOOR[0],DOOR[1],p):smooth(DOOR[0]+.03,DOOR[1],p),a=side*open*1.45,dx=v.x-side*4,dz=v.z+7.7;
 return {x:Math.cos(a)*dx-Math.sin(a)*dz,y:v.y,z:Math.sin(a)*dx+Math.cos(a)*dz};}
const LEAF=side=>side<0?[-.05,.2,-.15,4.05,9,.28]:[-4.05,.2,-.15,.05,9,.28];
function dirLocal(side,p,d){const open=side<0?smooth(DOOR[0],DOOR[1],p):smooth(DOOR[0]+.03,DOOR[1],p),a=side*open*1.45;return {x:Math.cos(a)*d.x-Math.sin(a)*d.z,y:d.y,z:Math.sin(a)*d.x+Math.cos(a)*d.z};}
function clearance(p,pos){let d=pos.y;for(const b of B)d=Math.min(d,boxDist(b,pos));for(const side of [-1,1])d=Math.min(d,boxDist(LEAF(side),leafLocal(side,p,pos)));return d;}
function slab(b,o,d,tmax){let t0=1e-6,t1=tmax;for(let k=0;k<3;k++){const ok='xyz'[k],inv=1/d[ok];let a=(b[k]-o[ok])*inv,c=(b[k+3]-o[ok])*inv;if(a>c)[a,c]=[c,a];t0=Math.max(t0,a);t1=Math.min(t1,c);if(t0>t1)return Infinity;}return t0;}
// First hit along a ray: {t, tag}. The ground plane is 'floor'; nothing is 'sky'.
function cast(p,o,d,tmax=400,skip){let best={t:tmax,tag:'sky'};if(d.y<0){const t=-o.y/d.y;if(t<best.t)best={t,tag:'floor'};}
 for(const b of B){if(skip&&skip.has(b[6]))continue;const t=slab(b,o,d,best.t);if(t<best.t)best={t,tag:b[6]};}
 for(const side of [-1,1]){const t=slab(LEAF(side),leafLocal(side,p,o),dirLocal(side,p,d),best.t);if(t<best.t)best={t,tag:'leaf'};}return best;}
function cam(s,aspect){const c=new T.PerspectiveCamera(s.fov,aspect,.35,400);c.position.set(s.position.x,s.position.y,s.position.z);c.quaternion.set(s.quaternion.x,s.quaternion.y,s.quaternion.z,s.quaternion.w);c.updateMatrixWorld(true);c.updateProjectionMatrix();return c;}
const ndc=(c,x,y,z)=>{const v=new T.Vector3(x,y,z).applyMatrix4(c.matrixWorldInverse);if(v.z>-c.near)return null;const q=new T.Vector3(x,y,z).project(c);return {x:q.x,y:q.y};};
const LOGO=[[-5.125,10.66],[5.125,10.66],[-5.125,12.14],[5.125,12.14]];
function logoState(s,aspect,p){const c=cam(s,aspect);const P=LOGO.map(([x,y])=>ndc(c,x,y,-7.16));
 const framed=P.every(q=>q&&Math.abs(q.x)<1&&Math.abs(q.y)<1);let clear=true;
 // Corners and edge centres (the two thin canopy stays cross the face of the sign from below; see notes).
 for(const [x,y] of [[-5.1,10.68],[5.1,10.68],[-5.1,12.12],[5.1,12.12],[0,10.68],[0,12.12]]){if(!clear)break;const o=new T.Vector3(s.position.x,s.position.y,s.position.z),d=new T.Vector3(x,y,-7.16).sub(o),len=d.length();d.normalize();
  if(cast(p,o,d,len-.02,new Set(['sign'])).tag!=='sky')clear=false;}
 return {framed,clear,width:framed?Math.max(P[1].x-P[0].x,P[3].x-P[2].x)/2:0,bottom:framed?Math.min(P[0].y,P[1].y):-9,top:framed?Math.max(P[2].y,P[3].y):9,cx:framed?(P[0].x+P[1].x)/2:9};}
function polyFrac(c,pts){let P=pts.map(p=>new T.Vector3(...p).applyMatrix4(c.matrixWorldInverse));const n=c.near*1.0001,cl=[];
 for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],ai=a.z<=-n,bi=b.z<=-n;if(ai)cl.push(a);if(ai!==bi)cl.push(a.clone().lerp(b,(-n-a.z)/(b.z-a.z)));}
 if(cl.length<3)return {area:0,cy:0};let Q=cl.map(v=>{const q=v.clone().applyMatrix4(c.projectionMatrix);return [q.x,q.y];});
 for(const [ax,sg] of [[0,1],[0,-1],[1,1],[1,-1]]){const out=[];for(let i=0;i<Q.length;i++){const a=Q[i],b=Q[(i+1)%Q.length],ai=a[ax]*sg<=1,bi=b[ax]*sg<=1;if(ai)out.push(a);if(ai!==bi){const t=(1-a[ax]*sg)/((b[ax]-a[ax])*sg);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}Q=out;if(Q.length<3)return {area:0,cy:0};}
 let A=0,cy=0;for(let i=0;i<Q.length;i++){const a=Q[i],b=Q[(i+1)%Q.length],cr=a[0]*b[1]-b[0]*a[1];A+=cr;cy+=(a[1]+b[1])*cr;}return {area:Math.abs(A)/8,cy:cy/(3*A)};}
const WEDGE=(()=>{const R=[],n=12;for(let i=0;i<=n;i++){const d=13.75*i/n;R.push([.06+4.5*d/14,0,-7.7+d]);}return [...R,...R.slice().reverse().map(p=>[-p[0],0,p[2]])];})();
const DOORWAY=[[-4.23,.25,-8.1],[4.23,.25,-8.1],[4.23,9.04,-8.1],[-4.23,9.04,-8.1]];
function sunDir(p){const el=(SUN_EL[0]+(SUN_EL[1]-SUN_EL[0])*smooth(3.9,5,p))/D,az=SUN_AZ/D;return new T.Vector3(Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el));}
function sunInDoor(s,aspect,p){const c=cam(s,aspect),o=new T.Vector3(s.position.x,s.position.y,s.position.z),d=sunDir(p),q=ndc(c,o.x+d.x*300,o.y+d.y*300,o.z+d.z*300);
 if(!q||Math.abs(q.x)>=1||Math.abs(q.y)>=1)return false;const hit=cast(p,o,d,300,new Set(['estate','road pole','kerb']));if(hit.tag!=='sky')return false;
 const t=(-8.1-o.z)/d.z,x=o.x+d.x*t,y=o.y+d.y*t;return t>0&&Math.abs(x)<4.23&&y>.25&&y<9.04;}
function surfaces(s,aspect,p,nx=40,ny=24){const c=cam(s,aspect),o=new T.Vector3(s.position.x,s.position.y,s.position.z),count={},plane={};
 for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){const d=new T.Vector3((i+.5)/nx*2-1,(j+.5)/ny*2-1,.5).unproject(c).sub(o).normalize(),h=cast(p,o,d);
  let k=h.tag;if(FEATURELESS[k]){const P=o.clone().addScaledVector(d,h.t);k+=Math.abs(P.x)>10.6?(P.x<0?':left':':right'):P.z<-44?':back':P.y>9.8?':roof':':'+Math.round(P.z);}count[k]=(count[k]||0)+1;}
 let worst=['',0];for(const k in count){const f=count[k]/(nx*ny);plane[k]=f;if(k.includes(':')&&f>worst[1])worst=[k,f];}return {worst,sky:(count.sky||0)/(nx*ny),floor:(count.floor||0)/(nx*ny)};}

// ---------------------------------------------------------------- route sampling: 10,001 x 6 aspects x 5 pointers
let count=0,minClear=Infinity,minClearAt=null,maxPitch=0,maxRoll=0,maxParallax=0,inbound=[],outbound=[],exitWorstX=0;
const yaw4=rv.sample(4).yaw,turnStart={};
for(const aspect of ASPECTS)for(const pointer of POINTERS){
 for(let n=0;n<=10000;n++){const p=n/2000,s=rv.sample(p,aspect,...pointer),b=rv.sample(p,aspect);count++;
  assert([...s.position.toArray(),...s.quaternion.toArray(),s.fov].every(Number.isFinite),'finite');assert(Math.abs(s.quaternion.length()-1)<1e-12,'unit quaternion');
  const again=rv.sample(p,aspect,...pointer);assert(s.position.equals(again.position)&&s.quaternion.equals(again.quaternion)&&s.fov===again.fov,'deterministic');
  const right=new T.Vector3(1,0,0).applyQuaternion(s.quaternion),fwd=new T.Vector3(0,0,-1).applyQuaternion(s.quaternion);
  maxRoll=Math.max(maxRoll,Math.abs(right.y));maxPitch=Math.max(maxPitch,Math.abs(Math.asin(fwd.y))*D);
  maxParallax=Math.max(maxParallax,s.position.distanceTo(b.position));
  // Near-plane clearance: no geometry within the distance to the near-plane corners (+5 cm).
  const need=.35*Math.sqrt(1+Math.tan(s.fov/2/D)**2*(1+aspect*aspect))+.05,c=clearance(p,s.position);
  if(c<minClear){minClear=c;minClearAt=[p,aspect,pointer.join()];}assert(c>need,'near-plane clearance '+[p,aspect,pointer,c.toFixed(3),need.toFixed(3)]);
  if(pointer[0]===0&&pointer[1]===0){
   if(s.position.z<-3.6&&s.position.z>-8.6&&p<4)assert(p>=DOOR[1],'door sweep entered before the leaves are fully open at '+p);
   if(n&&p<4){const q=rv.sample((n-1)/2000,aspect);if(q.position.z>=-7.75&&s.position.z<-7.75)inbound.push(p);}
   if(p>4){const q=rv.sample((n-1)/2000,aspect);if(q.position.z<-7.75&&s.position.z>=-7.75)outbound.push(p);
    if(s.position.z>-8.6&&s.position.z<-3.5)exitWorstX=Math.max(exitWorstX,Math.abs(s.position.x));
    if(s.yaw<rv.sample(4,aspect).yaw-1e-9&&turnStart[aspect]===undefined)turnStart[aspect]=[p,s.position.z];}
  }
 }
}
assert(maxRoll<1e-9,'roll is zero');assert(maxPitch<=20,'pitch within 20 degrees: '+maxPitch);assert(maxParallax<=.1+1e-9,'parallax <= .1 m: '+maxParallax);
assert(exitWorstX<3.5,'exit through the centre: |x| '+exitWorstX);
for(const a of ASPECTS)assert(turnStart[a]&&turnStart[a][1]>-3,'4-5: the left turn starts only past z -3 '+a+' '+turnStart[a]);
note('samples',count);note('minClearance',[+minClear.toFixed(3),minClearAt]);note('pitchMax',+maxPitch.toFixed(2));note('parallaxMax',+maxParallax.toFixed(4));
note('doorPlane',{in:[Math.min(...inbound),Math.max(...inbound)],out:[Math.min(...outbound),Math.max(...outbound)]});note('exit|x|max',+exitWorstX.toFixed(2));note('turnStart',turnStart);

// ---------------------------------------------------------------- yaw: both turns run left, smooth in scroll and in time
// Reference: the previous route (git daefc8f) 3->4 turn, sampled the same way.
const OLD=[[[3.4,3.4,18],[0,7.3,-7.16],[.8,3.9,20],[0,7.6,-7.16]],[[0,5.6,7],[0,7.8,-7.16],[0,5.6,8.4],[0,8,-7.16]],[[-.45,3.1,-17],[0,3.8,-33],[0,3.15,-16],[0,4,-33]],
 [[1.6,3.45,-28.8],[0,1.65,-32],[.7,3.5,-28.2],[0,1.75,-32]],[[-.8,3.6,-26],[0,4.6,1],[-.25,3.6,-26],[0,4.8,1]],[[.1,2.55,-14],[0,5,8],[0,2.7,-14],[0,5.2,8]]];
function oldYaw(p,aspect){const w=Math.max(0,Math.min(1,(1.15-aspect)/.6)),val=k=>{const y=[];OLD.forEach((c,i)=>{const P=c[k],Q=c[k+1];let a=Math.atan2(Q[0]-P[0],-(Q[2]-P[2]));if(i){while(a-y[i-1]>Math.PI)a-=2*Math.PI;while(a-y[i-1]<-Math.PI)a+=2*Math.PI;}y.push(a);});
  const m=y.map((_,i)=>{if(!i||i===y.length-1)return 0;const a=y[i]-y[i-1],b=y[i+1]-y[i];return a*b>0?2*a*b/(a+b):0;}),i=Math.min(4,Math.floor(p)),u=p-i,u2=u*u,u3=u2*u;
  return (2*u3-3*u2+1)*y[i]+(u3-2*u2+u)*m[i]+(-2*u3+3*u2)*y[i+1]+(u3-u2)*m[i+1];};return val(0)*(1-w)+val(2)*w;}
function peakRaw(f,a,r0,r1){let pk=0,at=0,prev=f(travel(r0),a);for(let r=r0+1e-4;r<=r1+1e-9;r+=1e-4){const y=f(travel(r),a),v=Math.abs(y-prev)*1e4*D;if(v>pk){pk=v;at=r;}prev=y;}return [pk,at];}
// In time: steady scrolls of .25, .5 and 1 chapter per second through rvTravel and the shared damping (6.2/s).
function peakTime(f,a){let pk=0;for(const speed of [.25,.5,1]){let s=0,raw=0,prev=f(0,a);for(let t=0;raw<5;t+=1/120){raw=Math.min(5,raw+speed/120);s+=(travel(raw)-s)*(1-Math.exp(-6.2/120));const y=f(s,a);pk=Math.max(pk,Math.abs(y-prev)*120*D);prev=y;}}return pk;}
// A flick (target jumps a whole chapter, damping alone moves the camera) is reported, not gated: it scales with the damping.
function peakFlick(f,a,from,to){let pk=0,s=from,prev=f(s,a);for(let t=0;t<2;t+=1/120){s+=(to-s)*(1-Math.exp(-6.2/120));const y=f(s,a);pk=Math.max(pk,Math.abs(y-prev)*120*D);prev=y;}return pk;}
function peakSmooth(f,a,p0,p1){let pk=0,prev=f(p0,a);for(let p=p0+1e-4;p<=p1+1e-9;p+=1e-4){const y=f(p,a);pk=Math.max(pk,Math.abs(y-prev)*1e4*D);prev=y;}return pk;}
const newYaw=(p,a)=>rv.sample(p,a).yaw,yawNotes={};
for(const a of [16/9,1.6,1,.75,PORTRAIT]){
 const [oldPk]=peakRaw(oldYaw,a,3,4),[newPk,at]=peakRaw(newYaw,a,0,5),oldT=peakTime(oldYaw,a),newT=peakTime(newYaw,a);
 assert(newPk<=1.2*oldPk,'peak yaw rate per scroll '+[a,newPk.toFixed(0),oldPk.toFixed(0)]);assert(newT<=1.2*oldT,'peak yaw rate in time '+[a,newT.toFixed(0),oldT.toFixed(0)]);
 let prev=rv.sample(3,a).yaw;for(let p=3;p<=5;p+=.001){const y=rv.sample(p,a).yaw;assert(y<=prev+1e-9,'turns 3-4 and 4-5 run left at '+p);prev=y;}
 assert(rv.sample(3,a).yaw>-Math.PI/2&&rv.sample(4,a).yaw<-Math.PI,'3-4 swings across the left column row to the doorway');
 yawNotes[a.toFixed(3)]={perRaw:[+newPk.toFixed(0),+at.toFixed(3)],oldPerRaw:+oldPk.toFixed(0),ratio:+(newPk/oldPk).toFixed(2),perSecondSteady:+newT.toFixed(0),oldPerSecondSteady:+oldT.toFixed(0),
  perSmooth34:+peakSmooth(newYaw,a,3,4).toFixed(0),perSmooth45:+peakSmooth(newYaw,a,4,5).toFixed(0),oldPerSmooth34:+peakSmooth(oldYaw,a,3,4).toFixed(0),flick34:+peakFlick(newYaw,a,3,4).toFixed(0),flick45:+peakFlick(newYaw,a,4,5).toFixed(0),oldFlick34:+peakFlick(oldYaw,a,3,4).toFixed(0)};
}
note('yaw',yawNotes);
for(const k of rv.keys.slice(1)){const i=rv.keys.indexOf(k),j=rv.keys[i-1];for(const v of ['d','m'])assert(Math.abs(k[v].fov-j[v].fov)<=10,'adjacent keys within 10 degrees of fov '+k.name);}
// Continuity: C1 position at every key, and bounded steps per .0005 of scroll.
for(const k of rv.keys.slice(1,-1))for(const a of [1.6,PORTRAIT]){const e=1e-5,A=rv.sample(k.s-e,a).position,B0=rv.sample(k.s,a).position,C=rv.sample(k.s+e,a).position;
 assert(B0.clone().sub(A).divideScalar(e).distanceTo(C.clone().sub(B0).divideScalar(e))<.02,'C1 position at '+k.name);}
let maxStep=0,maxAng=0;for(const a of ASPECTS){let prev=rv.sample(0,a);for(let n=1;n<=10000;n++){const s=rv.sample(travel(n/2000),a),st=s.position.distanceTo(prev.position),ang=2*Math.acos(Math.min(1,Math.abs(s.quaternion.dot(prev.quaternion))));maxStep=Math.max(maxStep,st);maxAng=Math.max(maxAng,ang);prev=s;}}
assert(maxStep<.08,'position step per .0005 scroll '+maxStep);assert(maxAng<.006,'rotation step per .0005 scroll '+maxAng);note('maxStepPer.0005raw',[+maxStep.toFixed(4),+maxAng.toFixed(5)]);

// ---------------------------------------------------------------- composition
const comp={};
// 0-1.15 (and the published logo window): every logo corner framed and clear of the canopy, all aspects and pointers.
const LW=rv.windows.logo;assert(LW[0]===0&&LW[1]>=1.15,'logo window covers 0-1.15');
for(const a of ASPECTS)for(const ptr of [[0,0],[1,-1],[-1,-1]])for(let n=0;n<=118;n++){const p=Math.min(LW[1],n/100),L=logoState(rv.sample(p,a,...ptr),a,p);assert(L.framed&&L.clear,'logo whole '+[p,a,ptr]);}
for(const p of [rv.windows.bookend[0],(rv.windows.bookend[0]+5)/2,5])for(const a of ASPECTS){const L=logoState(rv.sample(p,a),a,p);assert(L.framed&&L.clear,'logo whole in the bookend window '+[p,a]);}
const L0=DESK.map(a=>logoState(rv.sample(0,a),a,0)),L1=DESK.map(a=>logoState(rv.sample(1,a),a,1)),L5=DESK.map(a=>logoState(rv.sample(5,a),a,5));
L0.forEach(L=>assert(L.width>=.32&&L.width<=.40,'logo 32-40% at 0: '+L.width));L5.forEach(L=>assert(L.width>=.30&&L.width<=.40,'logo 30-40% at 5: '+L.width));
assert(L1[0].width>=.42,'logo >= 42% at 1 (1440x900): '+L1[0].width);L5.forEach(L=>assert(L.bottom>=1/3,'bookend: logo in the upper third '+L.bottom));
const P0=logoState(rv.sample(0,PORTRAIT),PORTRAIT,0),P1=logoState(rv.sample(1,PORTRAIT),PORTRAIT,1),P5=logoState(rv.sample(5,PORTRAIT),PORTRAIT,5);
for(const L of [P0,P1,P5])assert(L.width>=.65,'portrait logo >= 65% of the width: '+L.width);
const sky0=surfaces(rv.sample(0,PORTRAIT),PORTRAIT,0).sky,sky1=surfaces(rv.sample(1,PORTRAIT),PORTRAIT,1).sky;assert(sky0<=.15&&sky1<=.18,'portrait sky '+[sky0,sky1]);
comp.logoWidth={'0':L0.map(L=>+L.width.toFixed(3)),'1':L1.map(L=>+L.width.toFixed(3)),'5':L5.map(L=>+L.width.toFixed(3)),portrait:[P0,P1,P5].map(L=>+L.width.toFixed(3)),bookendBottomNdc:+L5[0].bottom.toFixed(2)};comp.portraitSky=[+sky0.toFixed(3),+sky1.toFixed(3)];
// Entrance and triptych: doors, logo and wedge on one vertical axis.
for(const a of [1.6,PORTRAIT])for(const p of [0,1]){const c=cam(rv.sample(p,a),a),lg=ndc(c,0,11.4,-7.16),dr=ndc(c,0,4.6,-7.75),ap=ndc(c,0,0,-7.7);
 assert(Math.abs(lg.x-dr.x)<.03&&(p===0||Math.abs(ap.x-lg.x)<.03),'one vertical axis at '+[p,a]);}
// The Spill: on the door axis the camera only pushes and cranes; the wedge sits in the lower half.
for(let p=KEY('spill');p<=KEY('leaves-open')+1e-9;p+=.01)for(const a of [1.6,PORTRAIT]){const s=rv.sample(p,a);assert(Math.abs(s.position.x)<1e-9&&Math.abs(s.yaw)<1e-9,'Spill: push and crane only at '+p);}
for(const a of [1.6,16/9,1,.75,PORTRAIT])for(let p=.6;p<=1.15;p+=.05){const w=polyFrac(cam(rv.sample(p,a),a),WEDGE);assert(w.area>.02&&w.cy<0,'wedge in the lower half '+[p,a,w.area,w.cy]);}
comp.wedgeAt1={desk:+polyFrac(cam(rv.sample(1,1.6),1.6),WEDGE).area.toFixed(3),portrait:+polyFrac(cam(rv.sample(1,PORTRAIT),PORTRAIT),WEDGE).area.toFixed(3)};
const WW=rv.windows.wedge;for(const a of [1.6,PORTRAIT])for(let p=WW[0]+.02;p<=WW[1];p+=.02)assert(polyFrac(cam(rv.sample(p,a),a),WEDGE).area>.005,'wedge window '+[p,a]);
// 2: centred one-point corridor.
for(const v of ['d','m']){const k=rv.keys.find(x=>x.name==='corridor')[v];assert(k.p[0]===0&&k.t[0]===0,'corridor on the centre line');}
// 3: low 3/4 of the stack: eye level, looking up; the left stack left, the booth whole in the lower right.
for(const a of [1.6,16/9,PORTRAIT]){const s=rv.sample(3,a),c=cam(s,a);assert(s.position.y<=2.2&&s.pitch>0,'low, looking up at 3');
 const st=ndc(c,-4.24,3.4,-35.8),bc=[];for(const x of [-1.24,1.24])for(const y of [0,1.47])for(const z of [-32.16,-31.24])bc.push(ndc(c,x,y,z));
 assert(st.x<0&&bc.every(q=>q&&Math.abs(q.x)<1&&Math.abs(q.y)<1)&&bc.reduce((m,q)=>m+q.x,0)/8>0&&bc.reduce((m,q)=>m+q.y,0)/8<0,'stack left, booth whole in the lower right '+a);}
// 4: the doorway fills 8-18% of the frame with the sun inside it, on every aspect.
comp.doorway4={};for(const a of ASPECTS){const s=rv.sample(4,a),f=polyFrac(cam(s,a),DOORWAY).area;assert(f>=.08&&f<=.18,'doorway 8-18% at 4 '+[a,f]);assert(sunInDoor(s,a,4),'sun inside the doorway at 4 '+a);comp.doorway4[a.toFixed(3)]=+f.toFixed(3);}
for(let p=rv.windows.sunrise[0];p<=rv.windows.sunrise[1]+1e-9;p+=.02)assert(sunInDoor(rv.sample(p,1.6),1.6,p),'sun in the doorway through the sunrise window '+p);
// 5: the bookend is on the same side as 0, lower and closer.
for(const a of [1.6,PORTRAIT]){const s0=rv.sample(0,a).position,s5=rv.sample(5,a).position,l=new T.Vector3(0,11.4,-7.16);
 assert(Math.sign(s0.x)===Math.sign(s5.x)&&s0.x!==0&&s5.y<s0.y&&s5.distanceTo(l)<s0.distanceTo(l),'bookend: same side, lower, closer '+a);}
// No frame more than 45% one featureless surface (walls, roof, facade) through the turn and the sunrise (3.55-4.1).
let worst=['',0,0];for(const a of [1.6,16/9,PORTRAIT])for(let p=3.55;p<=4.1+1e-9;p+=.01){const w=surfaces(rv.sample(p,a),a,p,32,20).worst;if(w[1]>worst[1])worst=[w[0],w[1],+p.toFixed(2),a];}
assert(worst[1]<=.45,'featureless surface '+worst);comp.featureless355to41=worst;
let worstAll=['',0,0];for(const a of [1.6,PORTRAIT])for(let p=0;p<=5+1e-9;p+=.05){const w=surfaces(rv.sample(p,a),a,p,32,20).worst;if(w[1]>worstAll[1])worstAll=[w[0],+w[1].toFixed(2),+p.toFixed(2),a];}
comp.featurelessWholeRoute=worstAll;note('composition',comp);

// ---------------------------------------------------------------- windows, host behaviour, purity
for(const k of ['logo','spill','wedge','triptych','logoDeparture','crossing','hall','booth','turn','doorway','sunrise','exit','turnBack','bookend'])assert(Array.isArray(rv.windows[k])&&rv.windows[k][0]<rv.windows[k][1],'window '+k);
for(const k in rv.windows){const [a,b]=rv.windows[k],[ra,rb]=rv.windowsRaw[k];assert(Math.abs(travel(ra)-a)<2e-3&&Math.abs(travel(rb)-b)<2e-3,'raw window '+k);}
assert(inbound.every(p=>p>=rv.windows.crossing[0]&&p<=rv.windows.crossing[1])&&outbound.every(p=>p>=rv.windows.exit[0]&&p<=rv.windows.exit[1]),'door-plane crossings inside crossing/exit windows');
// Parallax is zero under reduced motion and on coarse pointers; nothing in camera.js reads the clock or the beat.
for(const flags of [{reduce:true},{coarse:true},{}]){const t=load(flags);for(const [w,h] of [[1440,900],[390,844]]){t.size(w,h);for(const p of [0,1,2,3,4,5]){t.RIG.smooth=p;t.RIG.mx=1;t.RIG.my=-1;t.applyCamera();
 const still=t.RV.camera.sample(p,w/h),moved=t.camera.position.distanceTo(still.position);if(flags.reduce||flags.coarse)assert(moved===0,'no parallax '+JSON.stringify(flags));else assert(moved>0&&moved<=.1+1e-9,'fine-pointer parallax');
 assert(Math.abs(t.camera.fov-still.fov)<1e-4);}}}
assert(!/uT|clock|tempo|beat|performance|Date|requestAnimationFrame|addEventListener/.test(CAMERA_SRC.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g,'')),'camera.js is a pure function of progress, aspect and pointer');
assert(T0.CAM.length===6&&T0.RV_CONFIG.camera===rv.chapters&&rv.chapters.every(c=>c.p&&c.t&&c.portrait),'legacy chapter records');
console.log(JSON.stringify({pass:true,...stats,verification:'CPU, real Three math, proxy geometry; no browser or GPU'},null,1));
