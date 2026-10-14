const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=require('path').resolve(__dirname,'..'),ctx={console};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(root+'/dist/landing-pages/secret-pathways-assets/three.min.js','utf8'),ctx);
vm.runInContext('const RV={},RV_CONFIG={},CAM=[],RIG={smooth:0,mx:0,my:0};let buildRig=()=>{},fitAspect=()=>{},applyCamera=()=>{};const camera=new THREE.PerspectiveCamera();function vpW(){return 1440}function vpH(){return 900}',ctx);
vm.runInContext(fs.readFileSync(root+'/src/ravers/camera.js','utf8')+';globalThis.test={RV,camera,applyCamera,RIG};',ctx);
const T=ctx.THREE,rv=ctx.test.RV.camera;let count=0,maxStep=0,maxAngle=0,entry=[];
for(const aspect of [16/9,1,.5625,390/844])for(const pointer of [[0,0],[-1,-1],[1,1]]){
 let prev,first=true;
 for(let n=0;n<=10000;n++){
  const p=n/2000,s=rv.sample(p,aspect,...pointer);count++;
  assert([...s.position.toArray(),...s.quaternion.toArray(),s.fov].every(Number.isFinite));assert(Math.abs(s.quaternion.length()-1)<1e-12);assert(s.position.y>2.4&&s.position.y<6);
  assert(s.position.z>=-28.801&&s.position.z<=20.001);assert(s.fov>40&&s.fov<80);
  if(s.position.z<-3.6){assert(p>1.2,'door sweep entered before fully open');assert(Math.abs(s.position.x)<2.0,'central-lane clearance');}
  if(s.position.z<-7.7&&first){entry.push(p);first=false;assert(Math.abs(s.position.x)<3.5&&s.position.y<8.7);}
  // Finite door leaf boxes transformed back into their local coordinate systems.
  const q=Math.max(0,Math.min(1,(p-.35)/.85)),open=q*q*(3-2*q);
  for(const side of [-1,1]){const angle=side*open*1.45,dx=s.position.x-side*4,dz=s.position.z+7.7;
   const lx=Math.cos(angle)*dx-Math.sin(angle)*dz, lz=Math.sin(angle)*dx+Math.cos(angle)*dz;
   const center=-side*1.99;assert(!(Math.abs(lx-center)<2.15&&Math.abs(lz)<.30&&s.position.y<8.9),'door collision');}
  if(prev){const step=s.position.distanceTo(prev.position),dot=Math.abs(s.quaternion.dot(prev.quaternion));const angle=2*Math.acos(Math.min(1,dot));maxStep=Math.max(maxStep,step);maxAngle=Math.max(maxAngle,angle);assert(step<.02);assert(angle<.003);}
  const rewind=rv.sample(p,aspect,...pointer);assert(s.position.equals(rewind.position)&&s.quaternion.equals(rewind.quaternion),'deterministic');prev=s;
 }
 // Logo corner framing and ray clearance above solid canopy during explicit window.
 for(let n=0;n<=100;n++){
  const s=rv.sample(n/100,aspect,...pointer),cam=new T.PerspectiveCamera(s.fov,aspect,.35,220);cam.position.copy(s.position);cam.quaternion.copy(s.quaternion);cam.updateMatrixWorld(true);
  for(const x of [-5.125,5.125])for(const y of [10.66,12.14]){
   const v=new T.Vector3(x,y,-7.16),ndc=v.clone().project(cam);assert(Math.abs(ndc.x)<1&&Math.abs(ndc.y)<1,'logo framing '+[n,aspect,ndc.x,ndc.y]);
   for(const z of [-4.45,-6.25,-7.16]){const t=(z-s.position.z)/(v.z-s.position.z),height=s.position.y+(v.y-s.position.y)*t;assert(height>9.635,'logo canopy clearance '+[n,aspect,height]);}
  }
 }
}
for(const knot of [1,2,3,4]){const eps=1e-5,a=rv.sample(knot-eps),b=rv.sample(knot),c=rv.sample(knot+eps);assert(b.position.clone().sub(a.position).multiplyScalar(1/eps).distanceTo(c.position.clone().sub(b.position).multiplyScalar(1/eps))<.003,'C1 position');}
for(const p of [0,1,2,3,4,5]){ctx.test.RIG.smooth=p;ctx.test.applyCamera();assert(ctx.test.camera.position.equals(rv.sample(p,1.6).position));}
console.log(JSON.stringify({pass:true,samples:count,maxPositionStep:maxStep,maxQuaternionAngleRadians:maxAngle,portalCrossing:[Math.min(...entry),Math.max(...entry)],logo:'all corners in frustum, rays clear canopy across 0..1 for all tested aspects/pointers',verification:'CPU real-Three only; no browser or GPU'},null,2));
