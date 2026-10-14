/* Camera direction only. RIG.smooth (chapter progress 0..5, already eased by rvTravel and the
   shared damping) is the only input besides aspect and the pointer, so every frame is a pure
   function of scroll and the route is reversible. No clock, renderer, scene objects, listeners
   or animation loop here.

   The route is a ledger of keys at RIG.smooth values: the six chapter frames plus sub-keys that
   shape the moves between them. Each key has a desktop frame (d) and a portrait frame (m), each a
   position p, a look point t and a vertical fov. Orientation is yaw and pitch only (roll is always
   0), interpolated with the same shape-preserving Hermite as position, so no coordinate or angle
   overshoots or reverses between keys. A key gives its look as a point t (yaw unwrapped to the
   nearest turn from the previous key), as absolute yaw/pitch in degrees, or as hold (keep the
   previous yaw; pitch optional). Both 180-degree turns (3 to 4, 4 to 5) run left: yaw only falls
   from 3 to 5 (about -10 to -366 degrees), and the sub-keys keep the rate even per unit of scroll. */
const RV_CAMERA_KEYS=[
 // 0: the facade at 23:00 from the road, eye height, doors and logo on one axis, sodium head on the left edge.
 {s:0,name:'entrance',d:{p:[3,2.2,19.2],t:[0,6.3,-7.16],fov:35},m:{p:[.6,2.2,19],t:[0,2.6,-7.16],fov:64}},
 // Before the leaves part the camera settles onto the door axis. From here to 1.2 it only pushes and cranes.
 {s:.35,name:'spill',d:{p:[0,2.45,18.4],t:[0,6.05,-7.16],fov:35},m:{p:[0,2.35,18.4],t:[0,2.9,-7.16],fov:63}},
 // 1: the triptych. Logo, open door and the red wedge stacked on the door axis; craned to 3.2 m.
 {s:1,name:'triptych',d:{p:[0,3.2,16.5],t:[0,5,-7.16],fov:35},m:{p:[0,3,16.6],t:[0,4.2,-7.16],fov:59}},
 // The leaves are fully open at 1.2; the push ends with the logo still whole.
 {s:1.2,name:'leaves-open',d:{p:[0,3.1,15.4],t:[0,4.85,-7.16],fov:36},m:{p:[0,2.95,15.6],t:[0,4.1,-7.16],fov:60}},
 // Crossing (capture 1.6 = smooth 1.72): the open leaves at both edges, the red far end framed.
 {s:1.72,name:'crossing',d:{p:[0,2.15,-.5],t:[0,2.75,-40],fov:44},m:{p:[0,2.1,.4],t:[0,3,-40],fov:62}},
 // 2: one-point corridor down the hall to the speaker wall and back wash.
 {s:2,name:'corridor',d:{p:[0,1.9,-12.5],t:[0,3.3,-40],fov:44},m:{p:[0,1.9,-12],t:[0,3.7,-40],fov:62}},
 // Low 3/4 approach (capture 2.55 = smooth 2.62): the left stack rising.
 {s:2.62,name:'approach',d:{p:[-.5,1.8,-21],t:[-2.6,3.3,-36],fov:47},m:{p:[-.4,1.8,-20.8],t:[-2.2,3.4,-36],fov:64}},
 // 3: low 3/4 at the booth. The stack a monolith on the left, decks, lamp and 140 lower right.
 {s:3,name:'stack',d:{p:[-.9,1.7,-24.6],t:[-3,3,-36],fov:50},m:{p:[-.5,1.75,-23],t:[-1.5,3.2,-36],fov:68}},
 // The turn runs left across the column row (sub-keys keep the yaw rate even in scroll).
 {s:3.25,name:'turn-a',d:{p:[-1.5,1.9,-25],yaw:-69,pitch:-2,fov:57},m:{p:[-1.2,1.9,-24.6],yaw:-70,pitch:2,fov:68}},
 {s:3.45,name:'turn-b',d:{p:[-2,2.1,-25.5],yaw:-118.6,pitch:-1,fov:57},m:{p:[-1.8,2.1,-25.8],yaw:-125,pitch:3,fov:68}},
 // Mid-turn (capture 3.55 = smooth 3.62): columns lead to the doorway entering the left third.
 {s:3.62,name:'turn',d:{p:[-2.4,2.3,-25.6],yaw:-155,pitch:3,fov:55},m:{p:[-2.3,2.3,-26.6],yaw:-165,pitch:4,fov:68}},
 // 4: the doorway as a window onto the sunrise, the sun inside the opening, the gold band on the floor.
 {s:4,name:'sunrise',d:{p:[-4.3,3,-23],t:[-1.15,3.6,5],fov:60},m:{p:[-3.2,2.6,-27],t:[-.4,4.2,5],fov:76}},
 // 4 to 5: out through the centre of the doorway with the heading held until past the leaves
 // (z > -3), then the left turn back to the facade, laid out evenly in scroll while backing out.
 {s:4.1,name:'walk',d:{p:[-3.25,2.72,-17],hold:true,pitch:-2.5,fov:58},m:{p:[-2.4,2.45,-20],hold:true,pitch:0,fov:73}},
 {s:4.2,name:'walk-out',d:{p:[-2.2,2.45,-11.5],hold:true,pitch:-2.5,fov:55},m:{p:[-1.7,2.3,-13],hold:true,pitch:0,fov:71}},
 {s:4.42,name:'exit',d:{p:[-.4,2.1,-2.6],hold:true,pitch:-2.5,fov:50},m:{p:[-.3,2.05,-2.6],hold:true,pitch:0,fov:66}},
 {s:4.52,name:'out',d:{p:[-.16,2.07,1.43],yaw:-204.1,pitch:-2.5,fov:50},m:{p:[-.24,2.03,1.33],yaw:-204,pitch:0,fov:65}},
 {s:4.66,name:'turn-out',d:{p:[.72,2.04,6.85],yaw:-237.1,pitch:-2.75,fov:48},m:{p:[0,2.01,6.62],yaw:-240,pitch:-1,fov:64.5}},
 {s:4.8,name:'turn-back',d:{p:[1.78,2,11.95],yaw:-275.7,pitch:-3,fov:46},m:{p:[.28,1.98,11.59],yaw:-282.1,pitch:-2,fov:64}},
 {s:4.92,name:'facade',d:{p:[2.44,1.97,15.89],yaw:-316.8,pitch:1,fov:43},m:{p:[.46,1.96,15.9],yaw:-327,pitch:0,fov:64.5}},
 {s:4.984,name:'settle',d:{p:[2.59,1.95,17.67],yaw:-352,pitch:5.5,fov:41},m:{p:[.5,1.95,17.42],yaw:-357.5,pitch:3,fov:64.5}},
 // 5: the bookend. Same side as 0, lower and closer; the logo in the upper third.
 {s:5,name:'bookend',d:{p:[2.6,1.95,18],t:[0,5.2,-7.16],fov:40},m:{p:[.5,1.95,17.5],t:[0,3.5,-7.16],fov:64}}
];
const RV_CAMERA_RAD=Math.PI/180;
// Yaw: 0 looks down -z, negative turns left (toward -x). Pitch: positive looks up.
function rvCameraAngles(shot,prev){
 if(shot.hold)return [prev[0],shot.pitch===undefined?prev[1]:shot.pitch*RV_CAMERA_RAD];
 if(shot.t){const dx=shot.t[0]-shot.p[0],dy=shot.t[1]-shot.p[1],dz=shot.t[2]-shot.p[2];
  return [Math.atan2(dx,-dz),Math.atan2(dy,Math.hypot(dx,dz))];}
 return [shot.yaw*RV_CAMERA_RAD,shot.pitch*RV_CAMERA_RAD];
}
// Monotone piecewise cubic Hermite on non-uniform knots (Fritsch-Butland interior tangents,
// three-point shape-preserving ends): a coordinate never overshoots its keys and holds still
// across a key where its direction changes. The route needs no zero end tangents to settle:
// rvTravel already brings RIG.smooth to rest at every chapter key.
function rvCameraTrack(knots,values){
 const n=values.length,tangents=new Array(n).fill(0),h=[],d=[];
 for(let i=0;i<n-1;i++){h.push(knots[i+1]-knots[i]);d.push((values[i+1]-values[i])/h[i]);}
 for(let i=1;i<n-1;i++)if(d[i-1]*d[i]>0){const w1=2*h[i]+h[i-1],w2=h[i]+2*h[i-1];tangents[i]=(w1+w2)/(w1/d[i-1]+w2/d[i]);}
 const end=(h0,h1,d0,d1)=>{let m=((2*h0+h1)*d0-h0*d1)/(h0+h1);
  if(m*d0<=0)m=0;else if(d0*d1<=0&&Math.abs(m)>3*Math.abs(d0))m=3*d0;return m;};
 if(n>2){tangents[0]=end(h[0],h[1],d[0],d[1]);tangents[n-1]=end(h[n-2],h[n-3],d[n-2],d[n-3]);}
 return {knots,values,tangents};
}
function rvCameraValue(track,i,u){
 const h=track.knots[i+1]-track.knots[i],u2=u*u,u3=u2*u;
 return (2*u3-3*u2+1)*track.values[i]+(u3-2*u2+u)*h*track.tangents[i]
  +(-2*u3+3*u2)*track.values[i+1]+(u3-u2)*h*track.tangents[i+1];
}
function rvCameraProfile(portrait){
 const knots=RV_CAMERA_KEYS.map(k=>k.s),shots=RV_CAMERA_KEYS.map(k=>portrait?k.m:k.d),yaw=[],pitch=[];
 shots.forEach((s,i)=>{let [a,b]=rvCameraAngles(s,[yaw[i-1],pitch[i-1]]);
  if(i&&s.t){while(a-yaw[i-1]>Math.PI)a-=Math.PI*2;while(a-yaw[i-1]<-Math.PI)a+=Math.PI*2;}
  yaw.push(a);pitch.push(b);});
 return {knots,p:[0,1,2].map(k=>rvCameraTrack(knots,shots.map(s=>s.p[k]))),
  yaw:rvCameraTrack(knots,yaw),pitch:rvCameraTrack(knots,pitch),fov:rvCameraTrack(knots,shots.map(s=>s.fov))};
}
const RV_CAMERA_PROFILES=[rvCameraProfile(false),rvCameraProfile(true)];
const RV_CAMERA_UP=new THREE.Vector3(0,1,0),RV_CAMERA_MATRIX=new THREE.Matrix4(),RV_CAMERA_PARALLAX=.1;
function rvCameraOutput(){return {position:new THREE.Vector3(),target:new THREE.Vector3(),
 quaternion:new THREE.Quaternion(),direction:new THREE.Vector3(),fov:37,yaw:0,pitch:0,progress:0,portrait:0};}
function rvCameraBlend(wide,tall,i,u,portrait){return rvCameraValue(wide,i,u)*(1-portrait)+rvCameraValue(tall,i,u)*portrait;}
// Portrait weight: 0 at aspect >= 1.15 (desktop frames), 1 at <= .55 (portrait frames), blended between.
function rvCameraPortrait(aspect){return Math.max(0,Math.min(1,(1.15-aspect)/.60));}
function rvCameraSample(progress,aspect=16/9,pointerX=0,pointerY=0,out=rvCameraOutput()){
 const p=Number.isFinite(progress)?Math.max(0,Math.min(5,progress)):0;
 const a=Number.isFinite(aspect)&&aspect>0?aspect:16/9,portrait=rvCameraPortrait(a);
 const knots=RV_CAMERA_PROFILES[0].knots;let i=0;while(i<knots.length-2&&p>=knots[i+1])i++;
 const u=Math.min(1,(p-knots[i])/(knots[i+1]-knots[i]));
 const wide=RV_CAMERA_PROFILES[0],tall=RV_CAMERA_PROFILES[1];
 for(let k=0;k<3;k++)out.position.setComponent(k,rvCameraBlend(wide.p[k],tall.p[k],i,u,portrait));
 const yaw=rvCameraBlend(wide.yaw,tall.yaw,i,u,portrait),pitch=rvCameraBlend(wide.pitch,tall.pitch,i,u,portrait),cp=Math.cos(pitch);
 out.direction.set(Math.sin(yaw)*cp,Math.sin(pitch),-Math.cos(yaw)*cp);
 out.target.copy(out.position).addScaledVector(out.direction,20);
 // Pointer parallax: at most .1 m (vector length), sideways along the camera's horizontal right
 // axis and vertically, re-aimed at the authored look point 20 m ahead. applyCamera passes 0 under
 // reduced motion and on coarse pointers; nothing here reads the clock or the beat.
 const px=Number.isFinite(pointerX)?Math.max(-1,Math.min(1,pointerX)):0;
 const py=Number.isFinite(pointerY)?Math.max(-1,Math.min(1,pointerY)):0;
 let ox=px,oy=py*.55;const len=Math.hypot(ox,oy);if(len>1){ox/=len;oy/=len;}
 const amount=RV_CAMERA_PARALLAX*(1-portrait*.65);
 out.position.x+=Math.cos(yaw)*ox*amount;out.position.z+=Math.sin(yaw)*ox*amount;out.position.y+=oy*amount;
 out.direction.subVectors(out.target,out.position).normalize();
 RV_CAMERA_MATRIX.lookAt(out.position,out.target,RV_CAMERA_UP);
 out.quaternion.setFromRotationMatrix(RV_CAMERA_MATRIX).normalize();
 out.fov=rvCameraBlend(wide.fov,tall.fov,i,u,portrait);out.yaw=yaw;out.pitch=pitch;out.progress=p;out.portrait=portrait;
 return out;
}
// Raw scroll progress (the capture moments, before rvTravel) at which RIG.smooth equals s.
// An integer s is held over a range of raw progress: edge<0 returns its start, edge>0 its end.
function rvCameraRaw(s,edge=-1){
 const [a,b]=RV_CONFIG.travel,i=Math.floor(s),u=s-i;
 if(u<1e-9)return Math.max(0,Math.min(5,edge<0?i-(1-b):i+a));
 const t=.5-Math.sin(Math.asin(1-2*u)/3);return i+a+(b-a)*t;
}
// Composition windows in RIG.smooth for the choreographer (values in docs/camera-notes.md).
const RV_CAMERA_WINDOWS={
 logo:[0,1.25],         // every corner of the logo framed and clear of the canopy, on every aspect
 spill:[.35,1.2],       // on the door axis the camera only pushes and cranes
 wedge:[.38,1.73],      // the red wedge is on screen, every aspect (from its first blade until it passes below frame)
 triptych:[.8,1.25],    // full wedge, open door and whole logo stacked on one vertical axis
 logoDeparture:[1.25,1.52], // the logo leaves through the top of frame; gone on every aspect by 1.52
 crossing:[1.78,1.92],  // between the open leaves and through the door plane (z -7.75 at 1.88)
 entry:[1.2,2],
 hall:[2,2.62],
 booth:[2.62,3.1],      // low 3/4: the left stack, the decks, the lamp and the 140
 turn:[3,4],            // the left turn across the column row
 doorway:[3.52,4.27],   // the doorway is in frame (desktop)
 sunrise:[3.62,4.27],   // the sun is inside the doorway and in frame (desktop)
 exit:[4.26,4.42],      // out through the centre of the doorway and past the leaves, heading held
 turnBack:[4.42,5],     // the left turn back to the facade while the camera backs out
 bookend:[4.988,5]      // the facade and the whole logo framed again, every aspect
};
const RV_CAMERA_WINDOWS_RAW={};
for(const k in RV_CAMERA_WINDOWS){const [a,b]=RV_CAMERA_WINDOWS[k];RV_CAMERA_WINDOWS_RAW[k]=[+rvCameraRaw(a,-1).toFixed(3),+rvCameraRaw(b,1).toFixed(3)];}
// Chapter records for the legacy rig (CAM, RV_CONFIG.camera): the six integer keys.
const RV_CAMERA_CHAPTERS=RV_CAMERA_KEYS.filter(k=>Number.isInteger(k.s)).map(k=>{
 const look=(shot)=>{if(shot.t)return shot.t.slice();const [y,x]=rvCameraAngles(shot,[0,0]);return [shot.p[0]+Math.sin(y)*20,shot.p[1]+Math.tan(x)*20,shot.p[2]-Math.cos(y)*20];};
 return {name:k.name,p:k.d.p.slice(),t:look(k.d),fov:k.d.fov,portrait:{p:k.m.p.slice(),t:look(k.m),fov:k.m.fov}};});
RV_CONFIG.camera=RV_CAMERA_CHAPTERS;
CAM.splice(0,CAM.length,...RV_CAMERA_CHAPTERS);
const RV_CAMERA_CURRENT=rvCameraOutput();
RV.camera={sample:rvCameraSample,createSample:rvCameraOutput,keys:RV_CAMERA_KEYS,chapters:RV_CAMERA_CHAPTERS,
 windows:RV_CAMERA_WINDOWS,windowsRaw:RV_CAMERA_WINDOWS_RAW,raw:rvCameraRaw,portraitWeight:rvCameraPortrait,
 parallax:RV_CAMERA_PARALLAX,current:RV_CAMERA_CURRENT};

// Keep the authored rig construction (camera layers, temporary camera); replace only the sampled path.
const rvCameraBuildRig=buildRig;
buildRig=function(){rvCameraBuildRig();camera.up.copy(RV_CAMERA_UP);};
fitAspect=function(p,t,fov){return fov;};
applyCamera=function(){
 // Parallax is a fine-pointer, full-motion nicety: zero under reduced motion and on touch.
 const still=REDUCE||COARSE;
 const s=rvCameraSample(RIG.smooth,vpW()/vpH(),still?0:RIG.mx,still?0:RIG.my,RV_CAMERA_CURRENT);
 camera.position.copy(s.position);camera.quaternion.copy(s.quaternion);
 if(Math.abs(camera.fov-s.fov)>1e-4){camera.fov=s.fov;camera.updateProjectionMatrix();}
};
