/* Camera direction only. RIG.smooth already carries the shared travel easing.
   No clock, renderer, scene objects, scroll listeners or animation loop here. */
const RV_CAMERA_CHAPTERS=[
 {name:'entrance',p:[3.4,3.4,18],t:[0,7.3,-7.16],fov:48,portrait:{p:[.8,3.9,20],t:[0,7.6,-7.16],fov:63}},
 {name:'threshold',p:[0,5.6,7],t:[0,7.8,-7.16],fov:54,portrait:{p:[0,5.6,8.4],t:[0,8,-7.16],fov:74}},
 {name:'empty-hall',p:[-.45,3.1,-17],t:[0,3.8,-33],fov:55,portrait:{p:[0,3.15,-16],t:[0,4,-33],fov:65}},
 {name:'booth',p:[1.6,3.45,-28.8],t:[0,1.65,-32],fov:55,portrait:{p:[.7,3.5,-28.2],t:[0,1.75,-32],fov:69}},
 {name:'lookback-sunrise',p:[-.8,3.6,-26],t:[0,4.6,1],fov:53,portrait:{p:[-.25,3.6,-26],t:[0,4.8,1],fov:62}},
 {name:'afterglow',p:[.1,2.55,-14],t:[0,5,8],fov:52,portrait:{p:[0,2.7,-14],t:[0,5.2,8],fov:63}}
];
RV_CONFIG.camera=RV_CAMERA_CHAPTERS;
CAM.splice(0,CAM.length,...RV_CAMERA_CHAPTERS);

// Shape-preserving Hermite interpolation: smooth tangent joins without spline
// overshoot into architecture. A reversal stops before changing direction.
function rvCameraTrack(values){
 const slopes=values.slice(1).map((v,i)=>v-values[i]),tangents=values.map(()=>0);
 for(let i=1;i<values.length-1;i++){
  const a=slopes[i-1],b=slopes[i];
  if(a*b>0)tangents[i]=2*a*b/(a+b);
 }
 return {values,tangents};
}
function rvCameraValue(track,i,u){
 const u2=u*u,u3=u2*u;
 return (2*u3-3*u2+1)*track.values[i]+(u3-2*u2+u)*track.tangents[i]
  +(-2*u3+3*u2)*track.values[i+1]+(u3-u2)*track.tangents[i+1];
}
function rvCameraProfile(portrait){
 const shots=RV_CAMERA_CHAPTERS.map(c=>portrait?c.portrait:c),yaw=[],pitch=[];
 shots.forEach((s,i)=>{
  const dx=s.t[0]-s.p[0],dy=s.t[1]-s.p[1],dz=s.t[2]-s.p[2];
  let angle=Math.atan2(dx,-dz);
  if(i){while(angle-yaw[i-1]>Math.PI)angle-=Math.PI*2;while(angle-yaw[i-1]<-Math.PI)angle+=Math.PI*2;}
  yaw.push(angle);pitch.push(Math.atan2(dy,Math.hypot(dx,dz)));
 });
 return {p:[0,1,2].map(k=>rvCameraTrack(shots.map(s=>s.p[k]))),
  yaw:rvCameraTrack(yaw),pitch:rvCameraTrack(pitch),fov:rvCameraTrack(shots.map(s=>s.fov))};
}
const RV_CAMERA_PROFILES=[rvCameraProfile(false),rvCameraProfile(true)];
const RV_CAMERA_UP=new THREE.Vector3(0,1,0),RV_CAMERA_MATRIX=new THREE.Matrix4();
function rvCameraOutput(){return {position:new THREE.Vector3(),target:new THREE.Vector3(),
 quaternion:new THREE.Quaternion(),direction:new THREE.Vector3(),fov:48,progress:0,portrait:0};}
function rvCameraSample(progress,aspect=16/9,pointerX=0,pointerY=0,out=rvCameraOutput()){
 const p=Number.isFinite(progress)?Math.max(0,Math.min(5,progress)):0;
 const a=Number.isFinite(aspect)&&aspect>0?aspect:16/9;
 const portrait=Math.max(0,Math.min(1,(1.15-a)/.60));
 const i=Math.min(4,Math.floor(p)),u=p-i;
 const wide=RV_CAMERA_PROFILES[0],tall=RV_CAMERA_PROFILES[1];
 const value=(key)=>rvCameraValue(wide[key],i,u)*(1-portrait)+rvCameraValue(tall[key],i,u)*portrait;
 for(let k=0;k<3;k++)out.position.setComponent(k,rvCameraValue(wide.p[k],i,u)*(1-portrait)+rvCameraValue(tall.p[k],i,u)*portrait);
 const yaw=value('yaw'),pitch=value('pitch'),cp=Math.cos(pitch);
 out.direction.set(Math.sin(yaw)*cp,Math.sin(pitch),-Math.cos(yaw)*cp);
 out.target.copy(out.position).addScaledVector(out.direction,20);
 // Bounded pointer offsets cannot push the central path into the door leaves,
 // columns, floor or booth. Reduced motion is handled by the shared host.
 const px=Number.isFinite(pointerX)?Math.max(-1,Math.min(1,pointerX)):0;
 const py=Number.isFinite(pointerY)?Math.max(-1,Math.min(1,pointerY)):0;
 const parallax=.10*(1-portrait*.65);
 out.position.x+=px*parallax;out.position.y+=py*parallax*.55;
 out.direction.subVectors(out.target,out.position).normalize();
 RV_CAMERA_MATRIX.lookAt(out.position,out.target,RV_CAMERA_UP);
 out.quaternion.setFromRotationMatrix(RV_CAMERA_MATRIX).normalize();
 out.fov=value('fov');out.progress=p;out.portrait=portrait;
 return out;
}
const RV_CAMERA_CURRENT=rvCameraOutput();
RV.camera={sample:rvCameraSample,createSample:rvCameraOutput,chapters:RV_CAMERA_CHAPTERS,
 windows:{logo:[0,1],logoDeparture:[1,1.18],entry:[1.2,2],booth:[2.65,3.25],turn:[3,4],sunrise:[4,5]},
 current:RV_CAMERA_CURRENT};

// Retain authored rig construction and card-camera compatibility. Replace only
// the sampled path: legacy Catmull look-target interpolation crosses the camera
// during the 180-degree return and aspect fitting used an unsafe global dolly.
const rvCameraBuildRig=buildRig;
buildRig=function(){rvCameraBuildRig();camera.up.copy(RV_CAMERA_UP);};
fitAspect=function(p,t,fov){return fov;};
applyCamera=function(){
 const s=rvCameraSample(RIG.smooth,vpW()/vpH(),RIG.mx,RIG.my,RV_CAMERA_CURRENT);
 camera.position.copy(s.position);camera.quaternion.copy(s.quaternion);
 if(Math.abs(camera.fov-s.fov)>1e-4){camera.fov=s.fov;camera.updateProjectionMatrix();}
};
