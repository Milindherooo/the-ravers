import * as THREE from './assets/three.module.js';
import {smooth,mix,CONFIG} from './timeline.mjs';
// Scene systems share one clock. No textures or models fetched from elsewhere.
export function installEffects(scene,{cement,steel,trim,black,redMat,red,bone,mobile,left,right}){
const boxGeo=new THREE.BoxGeometry(1,1,1);function box(w,h,d,x,y,z,mat=black,parent=scene){const m=new THREE.Mesh(boxGeo,mat);m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=!mobile;m.receiveShadow=true;parent.add(m);return m;}
function textMap(label,sub,inverse=false){const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d');x.fillStyle=inverse?'#e8e3d8':'#10100f';x.fillRect(0,0,1024,512);x.fillStyle=inverse?'#090909':'#e8e3d8';x.font=Math.min(175,900/(label.length*.58))+'px Anton, sans-serif';x.fillText(label,52,252);x.font='24px Archivo, sans-serif';x.fillText(sub,58,422);x.fillStyle=red;x.fillRect(55,325,90,4);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
// ENTRANCE: steel locking bars retract before the heavy hinges travel.
const bolts=[];for(const [g,side] of [[left,1],[right,-1]])for(const y of [1.7,5.9]){const b=box(.72,.09,.13,side*2.76,y,.24,trim,g);bolts.push({b,x:b.position.x,side});box(.38,.26,.08,side*2.35,y,.19,black,g);}
const header=new THREE.Mesh(new THREE.PlaneGeometry(3.8,1.1),new THREE.MeshStandardMaterial({map:textMap('RAVERS.IN','AFTER HOURS / INDIA'),roughness:.9}));header.position.set(0,9.5,.8);scene.add(header);
// Two industrial cables. Tube geometry, no simulated physics allocations.
for(const side of [-1,1]){const pts=[new THREE.Vector3(side*5.1,9.5,1),new THREE.Vector3(side*5.6,7,1.4),new THREE.Vector3(side*5.3,4,1.3),new THREE.Vector3(side*5.7,1,1)];const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,.026,5,false),black);scene.add(m);}
// CORRIDOR: a travelling pressure wave in anchored ceiling baffles.
const ribs=[],ribGeo=new THREE.BoxGeometry(12,.075,.12);for(let i=0;i<19;i++){const group=new THREE.Group();group.position.set(0,8.12,-3-i*1.6);const r=new THREE.Mesh(ribGeo,trim);group.add(r);const line=new THREE.Mesh(new THREE.BoxGeometry(3.5,.018,.02),new THREE.MeshBasicMaterial({color:bone,transparent:true,opacity:.15}));line.position.set(0,-.046,.07);group.add(line);scene.add(group);ribs.push({group,line,index:i});}
// Physical floor inlay follows the route without adding a decorative HUD.
for(const side of [-1,1])box(.012,.005,29,side*2.6,1.155,-15,trim);
// THE HEART: a cable-mounted kinetic diaphragm, mechanically tied to the booth.
const iris=new THREE.Group();iris.position.set(0,5.4,-37.8);scene.add(iris);
for(const radius of [2.52,2.66,2.82]){const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.045,6,mobile?48:80),trim);iris.add(ring);}
const blades=[];for(let i=0;i<18;i++){const arm=new THREE.Group();arm.rotation.z=i/18*Math.PI*2;const hinge=new THREE.Group();hinge.position.set(0,1.7,0);const slat=box(.37,1.65,.08,0,.08,0,steel,hinge);arm.add(hinge);iris.add(arm);blades.push(hinge);}
for(const x of [-2.3,2.3])box(.025,1.7,.025,x,8.3,-37.8,trim);
const waveMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0},uEnergy:{value:1},uColor:{value:new THREE.Color(red)}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`varying vec2 vUv;uniform float uTime,uEnergy;uniform vec3 uColor;void main(){vec2 q=vUv-.5;float r=length(q);float mask=1.-smoothstep(.46,.49,r);float y=q.y-.075*sin(q.x*24.+uTime*4.)*sin(q.x*7.+uTime)*uEnergy;float line=exp(-abs(y)*180.)*.7;float rings=exp(-abs(r-(.19+.025*sin(uTime*2.)))*220.)*.2;gl_FragColor=vec4(uColor,(line+rings)*mask*uEnergy);}`});
const wave=new THREE.Mesh(new THREE.PlaneGeometry(4.1,4.1),waveMat);wave.position.z=.09;iris.add(wave);
// Speaker arrays with true cone displacement, suspension rings and cabinets.
const cones=[];for(const side of [-1,1])for(let j=0;j<3;j++){const x=side*5.35,y=2.1+j*1.65,z=-34.1;box(1.6,1.58,1.1,x,y,z,black);const ring=new THREE.Mesh(new THREE.TorusGeometry(.56,.055,8,36),trim);ring.position.set(x,y,z+.575);scene.add(ring);const cone=new THREE.Mesh(new THREE.ConeGeometry(.52,.21,32,1,true),new THREE.MeshStandardMaterial({color:'#262523',metalness:.3,roughness:.75,side:THREE.DoubleSide}));cone.rotation.x=Math.PI/2;cone.position.set(x,y,z+.51);scene.add(cone);const cap=new THREE.Mesh(new THREE.SphereGeometry(.155,16,8),black);cap.scale.z=.45;cap.position.set(x,y,z+.64);scene.add(cap);cones.push({cone,cap,z:z+.51,capZ:z+.64,phase:j*.14});}
// Procedural waveform bars on the back wall: instanced, no geometry rebuilt.
const eq=new THREE.InstancedMesh(boxGeo,trim,48),dummy=new THREE.Object3D();eq.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(eq);
// THE CULTURE: three suspended physical plaques, different proportions.
const culture=new THREE.Group();culture.position.set(-6.5,4.9,-23);culture.rotation.y=.8;scene.add(culture);
const labels=[['WEAR','01 / WEAR THE NIGHT'],['GATHER','02 / FOLLOW THE SOUND'],['BELONG','03 / FIND YOUR PEOPLE']];const cards=[];
labels.forEach(([title,sub],i)=>{const g=new THREE.Group();g.position.set((i-1)*2.15,(i===1?.3:0),0);culture.add(g);const w=i===1?2:1.85,h=i===1?3.7:3.2;box(w,h,.12,0,0,0,black,g);const plate=new THREE.Mesh(new THREE.PlaneGeometry(w-.09,h-.09),new THREE.MeshStandardMaterial({map:textMap(title,sub,i===1),roughness:.78,side:THREE.DoubleSide}));plate.position.z=.069;g.add(plate);for(const x of [-w*.36,w*.36])box(.015,3,.015,x,h/2+1.5,0,trim,g);const edge=box(w,.025,.022,0,-h/2,.09,new THREE.MeshBasicMaterial({color:red}),g);cards.push({g,plate,edge});});
const cultureLight=new THREE.PointLight(bone,30,13,2);cultureLight.position.set(-3,7,-20);scene.add(cultureLight);
// A large typeset banner passes overhead during the turn, printed in code.
const bannerMat=new THREE.MeshStandardMaterial({map:textMap('ONE FREQUENCY.','RAVERS.IN / NO BORDERS'),roughness:1,side:THREE.DoubleSide});const banner=new THREE.Mesh(new THREE.PlaneGeometry(9,2.6,20,5),bannerMat);banner.position.set(0,7.25,-15);scene.add(banner);const bannerBase=new Float32Array(banner.geometry.attributes.position.array);
// Sparse projected floor response: analytic rings, no particle cloud.
const floorWaveMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0},uOpacity:{value:0},uColor:{value:new THREE.Color(red)}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`varying vec2 vUv;uniform float uTime,uOpacity;uniform vec3 uColor;void main(){float r=length(vUv-.5)*2.;float a=0.;for(int i=0;i<3;i++){float k=fract(uTime*.12+float(i)/3.);a+=exp(-abs(r-k)*190.)*(1.-k);}gl_FragColor=vec4(uColor,a*uOpacity*(1.-smoothstep(.85,1.,r)));}`});const floorWave=new THREE.Mesh(new THREE.PlaneGeometry(17,17),floorWaveMat);floorWave.rotation.x=-Math.PI/2;floorWave.position.set(0,1.164,-30);scene.add(floorWave);
let focus=1;function update(p,time,reduced,dawn){const phase=time*CONFIG.tempo/60;const beat=reduced?0:Math.pow(.5+.5*Math.cos(phase*Math.PI*2),8);const energy=(.18+.82*smooth(.27,.53,p))*(1-dawn);
for(const {b,x,side} of bolts)b.position.x=x-side*smooth(.02,.07,p)*.55;
for(const {group,line,index} of ribs){const envelope=Math.exp(-Math.pow(index/19-(p-.18)*2.5,2)*38);group.rotation.x=reduced?0:Math.sin(index*.5-time*.5)*.035*energy;group.position.y=8.12+envelope*.22;line.material.opacity=(.04+envelope*.65)*(1-dawn*.9);}
blades.forEach((b,i)=>{b.rotation.z=.38+smooth(.33,.59,p)*.58+(reduced?0:Math.sin(time*.4+i*.3)*.06);b.rotation.x=smooth(.4,.6,p)*.2;});iris.rotation.z=reduced?0:Math.sin(time*.12)*.045;waveMat.uniforms.uTime.value=time;waveMat.uniforms.uEnergy.value=energy*(1+beat*.25);
for(const a of cones){a.cone.position.z=a.z+beat*.055*energy;a.cap.position.z=a.capZ+beat*.055*energy;}
for(let i=0;i<48;i++){const level=(.15+.85*Math.abs(Math.sin(i*.31+time*.9)*Math.sin(i*.7-time*.44)))*energy;dummy.position.set((i-23.5)*.34,1.5+level*.7,-39.2);dummy.scale.set(.12,.12+level*1.4,.08);dummy.updateMatrix();eq.setMatrixAt(i,dummy.matrix)}eq.instanceMatrix.needsUpdate=true;
cards.forEach(({g,edge,plate},i)=>{const reveal=smooth(.63+i*.013,.72+i*.013,p);g.rotation.y=(1-reveal)*-.65+(i-focus)*.035;g.position.z=i===focus?.35:0;edge.material.color.set(i===focus?red:'#353330');plate.material.emissive.set(i===focus?'#22201c':'#000000');});
const pos=banner.geometry.attributes.position;for(let i=0;i<pos.count;i++){const x=bannerBase[i*3];pos.array[i*3+2]=Math.sin(x*.7+time*.3)*.10;}pos.needsUpdate=true;
floorWaveMat.uniforms.uTime.value=time;floorWaveMat.uniforms.uOpacity.value=mobile?0:energy*.11;cultureLight.intensity=(24+smooth(.64,.74,p)*26)*(1-dawn*.4);
}
return {update,setFocus(i){focus=Math.max(0,Math.min(2,i));},dispose(){for(const c of cards)c.plate.material.map.dispose();bannerMat.map.dispose();header.material.map.dispose();}};
}
