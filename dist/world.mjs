import * as THREE from './assets/three.module.js';
import {CONFIG,cameraAt,stateAt,mix,smooth} from './timeline.mjs';
import {installEffects} from './effects.mjs';
export function createWorld(canvas){
const mobile=matchMedia('(pointer:coarse)').matches||innerWidth<701;
const css=getComputedStyle(document.documentElement);const bone=css.getPropertyValue('--bone').trim(),red=css.getPropertyValue('--signal').trim(),voidColor=css.getPropertyValue('--void').trim();
const renderer=new THREE.WebGLRenderer({canvas,antialias:!mobile,alpha:false,powerPreference:'high-performance'});
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.shadowMap.enabled=!mobile;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
const scene=new THREE.Scene();scene.background=new THREE.Color(voidColor);scene.fog=new THREE.FogExp2(voidColor,.019);
const camera=new THREE.PerspectiveCamera(47,1,.08,130);camera.rotation.order='YXZ';
const sharedBox=new THREE.BoxGeometry(1,1,1);let degraded=1;
function concrete(color,roughness=1){const mat=new THREE.MeshStandardMaterial({color,roughness,metalness:0});mat.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vSurface;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvSurface=(modelMatrix*vec4(transformed,1.0)).xyz;');shader.fragmentShader='varying vec3 vSurface;\nfloat grain(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}\nfloat noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(grain(i),grain(i+vec3(1,0,0)),f.x),mix(grain(i+vec3(0,1,0)),grain(i+vec3(1,1,0)),f.x),f.y),mix(mix(grain(i+vec3(0,0,1)),grain(i+vec3(1,0,1)),f.x),mix(grain(i+vec3(0,1,1)),grain(i+vec3(1,1,1)),f.x),f.y),f.z);}\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat n=noise3(vSurface*6.0); diffuseColor.rgb *= .78 + .28*n;');};return mat}
const cement=concrete('#5a554c'),darkCement=concrete('#36332e'),floorMat=concrete('#35332f',.86),steel=concrete('#20201e',.62);steel.metalness=.55;const trim=new THREE.MeshStandardMaterial({color:'#48463e',metalness:.75,roughness:.48});const black=new THREE.MeshStandardMaterial({color:'#101110',roughness:.8,metalness:.25});const redMat=new THREE.MeshBasicMaterial({color:red,toneMapped:false});
function box(w,h,d,x,y,z,mat=cement,parent=scene){const m=new THREE.Mesh(sharedBox,mat);m.scale.set(w,h,d);m.position.set(x,y,z);m.castShadow=!mobile;m.receiveShadow=true;parent.add(m);return m}
function batch(items,mat){const mesh=new THREE.InstancedMesh(sharedBox,mat,items.length),o=new THREE.Object3D();items.forEach((q,i)=>{o.position.set(q[3],q[4],q[5]);o.scale.set(q[0],q[1],q[2]);o.updateMatrix();mesh.setMatrixAt(i,o.matrix)});mesh.receiveShadow=true;mesh.castShadow=!mobile;scene.add(mesh);return mesh;}
// Ground, broad steps and the deep rectangular portal. All geometry is native.
box(100,.5,100,0,-.35,-14,floorMat);box(22,1.2,42,0,.55,-20,floorMat);
for(let i=0;i<5;i++)box(10.8-i*.15,(i+1)*.24,1.05,0,(i+1)*.12,4.5-i*.95,darkCement);
box(30,12,.9,-18,5.5,0,darkCement);box(30,12,.9,18,5.5,0,darkCement);
box(7,2.2,1.1,0,10.1,0,darkCement);
const portal=[{x:3.7,y:5.25,w:1,h:8.9,d:1.2,z:.15},{x:4.55,y:5.55,w:.6,h:9.6,d:.75,z:1.05},{x:5.3,y:5.8,w:.5,h:10.1,d:.65,z:1.7}];
portal.forEach(p=>{box(p.w,p.h,p.d,-p.x,p.y,p.z);box(p.w,p.h,p.d,p.x,p.y,p.z);box(p.x*2+p.w,.75,p.d,0,p.y+p.h/2-.25,p.z)});
// Each leaf pivots at its real outer hinge.
const left=new THREE.Group(),right=new THREE.Group();left.position.set(-3,1.2,0);right.position.set(3,1.2,0);scene.add(left,right);
for(const [g,side] of [[left,1],[right,-1]]){box(2.98,7.6,.22,side*1.49,3.8,0,steel,g);box(.026,7.4,.06,side*2.977,3.8,.145,redMat,g);box(.085,1.25,.13,side*2.59,3.25,.24,trim,g);for(const y of [1.35,5.95]){box(.16,.36,.22,side*.06,y,.18,black,g)}for(const y of [1.55,6.1])box(2.97,.012,.018,side*1.49,y,.121,black,g);}
// Interior colonnade and trusses, batched into a few draw calls.
let columns=[],beams=[],acoustic=[];
for(let z=-5;z>=-35;z-=5){for(const x of [-7,7]){columns.push([.85,8.2,.85,x,5.25,z]);columns.push([1.1,.25,1.1,x,1.34,z]);}beams.push([14.8,.28,.3,0,9.1,z]);beams.push([14.8,.16,.2,0,8.3,z]);}
for(const x of [-7,-3.5,0,3.5,7])beams.push([.15,.2,39,x,8.95,-18]);
batch(columns,cement);batch(beams,black);box(.5,8.5,40,-10.6,5.4,-20,darkCement);box(.5,8.5,40,10.6,5.4,-20,darkCement);box(21.5,.4,40,0,9.65,-20,darkCement);box(22,9,.4,0,5.2,-40,darkCement);
for(let x=-8;x<=8;x+=2)acoustic.push([.9,5.5,.3,x,4.8,-39.6]);batch(acoustic,black);
// Deliberately spare booth and sound architecture, no fake people or products.
box(7,1.7,1.6,0,2.15,-33,black);box(7.15,.12,1.75,0,3.06,-33,trim);box(9,.27,5,0,1.33,-33,darkCement);
for(const x of [-4.8,4.8]){box(.9,3.6,.65,x,3.15,-33.5,black);for(let y=2;y<4.5;y+=.7)box(.7,.015,.025,x,y,-33.155,trim)}
box(4.4,.036,.045,0,8.5,-39.35,redMat);
const triangle=new THREE.Shape();triangle.moveTo(-.6,-.5);triangle.lineTo(0,.55);triangle.lineTo(.6,-.5);triangle.closePath();const triGeo=new THREE.ShapeGeometry(triangle);for(let i=0;i<2;i++){const m=new THREE.Mesh(triGeo,new THREE.MeshStandardMaterial({color:red,roughness:.85}));m.position.set(i===0?-.64:.64,8.8,-39.33);if(i)m.rotation.z=Math.PI;scene.add(m)}
// Small side banners: a simple subdivided plane with procedural deformation.
const banners=[];const clothMat=new THREE.MeshStandardMaterial({color:'#171716',roughness:1,side:THREE.DoubleSide});for(let i=0;i<3;i++){const geo=new THREE.PlaneGeometry(2.4,4.8,8,12);const b=new THREE.Mesh(geo,clothMat);b.position.set(-9.8,5.2,-10-i*7);b.rotation.y=Math.PI/2;scene.add(b);banners.push({mesh:b,base:new Float32Array(geo.attributes.position.array),index:i});box(.05,.05,2.8,-9.8,7.65,-10-i*7,trim);}
// One side mezzanine adds foreground depth during the turn.
box(2.1,.22,13,9.2,5,-19,darkCement);for(let z=-13;z>=-25;z-=2)box(.045,1.05,.045,8.15,5.64,z,trim);box(.055,.055,13,8.15,6.18,-19,trim);
// Sparse physically motivated lights. No bloom or post-processing passes.
const hemi=new THREE.HemisphereLight(bone,'#181717',.75);scene.add(hemi);
const key=new THREE.DirectionalLight(bone,2.5);key.position.set(-7,12,13);key.castShadow=!mobile;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-17;key.shadow.camera.right=17;key.shadow.camera.top=17;key.shadow.camera.bottom=-17;key.shadow.camera.near=.5;key.shadow.camera.far=60;key.shadow.bias=-.001;key.shadow.normalBias=.035;scene.add(key);
const seamLight=new THREE.PointLight(red,17,11,2);seamLight.position.set(0,4.5,1);scene.add(seamLight);
const hallLight=new THREE.PointLight(bone,65,30,2);hallLight.position.set(0,8,-18);scene.add(hallLight);
const boothLight=new THREE.PointLight(red,46,18,2);boothLight.position.set(0,5,-34);scene.add(boothLight);
const sideLight=new THREE.PointLight(bone,18,18,2);sideLight.position.set(-7,6,-30);scene.add(sideLight);
const dawnLight=new THREE.DirectionalLight(bone,0);dawnLight.position.set(1,6,20);dawnLight.target.position.set(0,2,-30);scene.add(dawnLight,dawnLight.target);
const outsideMat=new THREE.MeshBasicMaterial({color:bone,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false});const outside=new THREE.Mesh(new THREE.PlaneGeometry(65,36),outsideMat);outside.position.set(0,9,16);scene.add(outside);
// A single plane shades the seam halo, not a screen-wide effect.
const haloMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uColor:{value:new THREE.Color(red)},uOpacity:{value:.2}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec2 vUv;uniform vec3 uColor;uniform float uOpacity;void main(){float a=exp(-abs(vUv.x-.5)*18.0)*smoothstep(0.0,.12,vUv.y)*smoothstep(0.0,.12,1.0-vUv.y);gl_FragColor=vec4(uColor,a*uOpacity);}',blending:THREE.AdditiveBlending});const halo=new THREE.Mesh(new THREE.PlaneGeometry(1.7,7.6),haloMat);halo.position.set(0,5,.18);scene.add(halo);
const effects=installEffects(scene,{cement,steel,trim,black,redMat,red,bone,mobile,left,right});
let width=0,height=0,dpr=0;function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;const ratio=Math.max(.65,Math.min(devicePixelRatio||1,mobile?CONFIG.dprMobile:CONFIG.dprDesktop,Math.sqrt(CONFIG.maxPixels/(w*h))))*degraded;if(w===width&&h===height&&ratio===dpr)return;width=w;height=h;dpr=ratio;renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
resize();let prevDoor=-1,lastCloth=-1;
function render(p,time=0,reduced=false){resize();const state=stateAt(p);const c=cameraAt(p,mobile);camera.position.fromArray(c.pos);camera.lookAt(...c.look);if(camera.fov!==c.fov){camera.fov=c.fov;camera.updateProjectionMatrix()}left.rotation.y=state.door;right.rotation.y=-state.door;halo.visible=state.door<.38;haloMat.uniforms.uOpacity.value=.15*(1-smooth(0,.38,state.door));const beat=reduced?0:Math.pow(.5+.5*Math.cos(time*Math.PI*2*CONFIG.tempo/60),6);seamLight.intensity=(12+beat*3)*(1-state.dawn);boothLight.intensity=(34+beat*7)*(1-state.dawn);redMat.color.set(red).multiplyScalar(1-state.dawn*.97);outsideMat.opacity=state.dawn;dawnLight.intensity=state.dawn*4;hemi.intensity=mix(.75,1.15,state.dawn);key.intensity=mix(2.5,.6,smooth(.1,.3,p));hallLight.intensity=mix(65,28,state.dawn);scene.fog.density=mix(.019,.01,state.dawn);renderer.toneMappingExposure=mix(1.1,1.24,state.dawn);
if(Math.abs(time-lastCloth)>.05||lastCloth<0){for(const {mesh,base,index} of banners){const a=mesh.geometry.attributes.position;for(let j=0;j<a.count;j++){const y=base[j*3+1];a.array[j*3+2]=Math.sin(y*1.2+time*.55+index)*.035*(2.4-y)/4.8;}a.needsUpdate=true;}lastCloth=time;}
if(Math.abs(prevDoor-state.door)>.003){renderer.shadowMap.needsUpdate=true;prevDoor=state.door;}effects.update(p,time,reduced,state.dawn);renderer.render(scene,camera);}
function lowerQuality(){if(degraded<=.7)return false;degraded=degraded>.85?.85:.7;renderer.shadowMap.enabled=false;resize();return true;}
return {render,resize,lowerQuality,renderer,scene,camera,setFocus:effects.setFocus,dispose(){effects.dispose();renderer.dispose();scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){for(const m of [].concat(o.material))m.dispose()}})}};
}
