/* RAVERS / environment layer. Same closure as world.js; no second animation loop.
   Reflections are clipped planar captures, not screen-space ray marching. */
const RV_ENV_CONFIG={
 reflection:{enabled:true,maxSize:512,minSize:192,every:3,minScale:.72,clipBias:.003,floorY:.026},
 fog:{enabled:true,opacity:.115,mobileOpacity:.065,speed:.045},
 consolidate:true,
 bounds:{warehouse:{min:[-11,0,-44],max:[11,10,-8]},apron:{min:[-16,0,-7.5],max:[16,14.3,17]},
  cameraLane:{min:[-3,.8,-30],max:[3,8,16]},booth:{min:[-2.3,0,-33],max:[2.3,1.8,-31]} }
};
const RV_ENV={resources:new Set(),puddles:[],fog:[],batches:[],reflection:null,reflectionCamera:null,
 textureMatrix:new THREE.Matrix4(),frame:0,disposed:false,mode:'procedural',lastCapture:-99,
 stats:{consolidated:0,batches:0},hidden:[],reflectionValid:false};
RV.environment=RV_ENV;
RV_ENV.config=RV_ENV_CONFIG;
function rvEnvOwn(resource){RV_ENV.resources.add(resource);return resource;}
function rvEnvMaterial(o){return rvEnvOwn(new THREE.MeshStandardMaterial(o));}
function rvEnvBatch(parts,material){if(!parts.length)return;const mesh=rvBatch(parts,material);mesh.castShadow=false;RV_ENV.resources.add(mesh.geometry);RV_ENV.batches.push(mesh);return mesh;}
function rvEnvBox(parts,w,h,d,x,y,z,rx=0,rz=0){const g=new THREE.BoxGeometry(w,h,d);if(rx)g.rotateX(rx);if(rz)g.rotateZ(rz);g.translate(x,y,z);parts.push(g);}
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
 // Exterior downpipe shoes and gutter: catches water at the two existing downpipes.
 rvEnvBox(hardware,32,.17,.26,0,13.91,-7.16);
 for(const x of [-9,9]){
  rvEnvBox(duct,.25,.22,.28,x,.17,-6.63);rvEnvBox(darkwork,.22,.09,.025,x,.19,-6.478);
  rvEnvBox(hardware,1.2,.018,.7,x,.025,-6.1);
  for(let k=0;k<12;k++)rvEnvBox(darkwork,.038,.02,.62,x-.52+k*.095,.041,-6.1);
 }
 // Service vent: metal louver depth, wire guard and attached feed pipe.
 rvEnvBox(duct,2.28,1.16,.19,11.5,5.6,-6.68);
 rvEnvBox(darkwork,2.1,1,.025,11.5,5.6,-6.57);
 for(let k=0;k<12;k++)rvEnvBox(hardware,2.07,.045,.16,11.5,5.15+k*.082,-6.51,-.25);
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
function rvEnvLightMaterials(){
 // Analytic baked irradiance/occlusion tint. Shared material hook; no point-light count added.
 // This is art-directed world-space fill, not a measured HDRI or ray-traced bake.
 for(const material of [mats.concrete,mats.steel,mats.dark,mats.edge,WORLD.floor.material]){
  const before=material.onBeforeCompile;
  material.onBeforeCompile=function(sh,rendererArg){
   if(before)before.call(this,sh,rendererArg);
   sh.vertexShader='varying vec3 vRVEnvPosition;\n'+sh.vertexShader.replace('#include <worldpos_vertex>',
    '#include <worldpos_vertex>\nvec4 rvEnvP=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nrvEnvP=instanceMatrix*rvEnvP;\n#endif\nvRVEnvPosition=(modelMatrix*rvEnvP).xyz;');
   sh.fragmentShader='varying vec3 vRVEnvPosition;\n'+sh.fragmentShader.replace('#include <output_fragment>',
    'float rvFloorAO=mix(.71,1.0,smoothstep(0.0,1.6,vRVEnvPosition.y));\n'+
    'float rvRoofAO=1.0-.16*smoothstep(8.25,10.0,vRVEnvPosition.y);\n'+
    'float rvBay=exp(-abs(vRVEnvPosition.x)*.10)*exp(-abs(vRVEnvPosition.z+7.8)*.10);\n'+
    'outgoingLight*=rvFloorAO*rvRoofAO;\n'+
    'outgoingLight+=vec3(.016,.014,.010)*rvBay;\n#include <output_fragment>');
  };
  material.needsUpdate=true;
 }
}
function rvEnvPuddles(){
 const material=rvEnvOwn(new THREE.ShaderMaterial({
  uniforms:{uTime:WORLD.uT,uReflection:{value:null},uTextureMatrix:{value:RV_ENV.textureMatrix},uLive:{value:0},uDawn:{value:0}},
  transparent:true,depthWrite:false,side:THREE.DoubleSide,
  vertexShader:'uniform mat4 uTextureMatrix; varying vec4 vProjected; varying vec3 vWorld; varying vec2 vUV; void main(){vec4 p=modelMatrix*vec4(position,1.0);vWorld=p.xyz;vUV=uv;vProjected=uTextureMatrix*p;gl_Position=projectionMatrix*viewMatrix*p;}',
  fragmentShader:`uniform sampler2D uReflection; uniform float uLive; uniform float uTime; uniform float uDawn;
   varying vec4 vProjected; varying vec3 vWorld; varying vec2 vUV;
   void main(){
    vec3 viewDir=normalize(cameraPosition-vWorld);float fresnel=.20+.70*pow(1.0-clamp(abs(viewDir.y),0.0,1.0),4.0);
    vec2 ripple=vec2(sin(vWorld.z*9.0+uTime*.31),cos(vWorld.x*11.0-uTime*.23))*.0008;
    vec2 uv=vProjected.xy/max(vProjected.w,.0001)+ripple;
    float valid=step(0.0,uv.x)*step(uv.x,1.0)*step(0.0,uv.y)*step(uv.y,1.0)*step(0.0,vProjected.w);
    vec3 sky=mix(vec3(.044,.041,.033),vec3(.34,.31,.25),uDawn);
    float reflectedSeam=exp(-pow((vWorld.x+.02)*5.0,2.0))*exp(-abs(vWorld.z+2.0)*.18)*(1.0-uDawn);
    vec3 fallback=sky+vec3(.32,.005,.008)*reflectedSeam;
    vec3 reflected=texture2D(uReflection,clamp(uv,vec2(.002),vec2(.998))).rgb;
    vec3 color=mix(fallback,reflected,uLive*valid);
    float edge=1.0-smoothstep(.29,.51,length(vUV-vec2(.5)));
    gl_FragColor=vec4(mix(vec3(.024,.023,.020),color,fresnel),(.48+.4*fresnel)*(.55+.45*edge));
    #include <tonemapping_fragment>
    #include <encodings_fragment>
   }`
 }));
 RV_ENV.puddleMaterial=material;
 const oldMaterials=new Set();
 scene.traverse(o=>{if(o.isMesh&&o.geometry.type==='ShapeGeometry'&&Math.abs(o.position.y-.022)<.001){oldMaterials.add(o.material);o.material=material;o.position.y=RV_ENV_CONFIG.reflection.floorY;RV_ENV.puddles.push(o);}});
 oldMaterials.forEach(m=>m.dispose());
 for(const [x,z,sx,sz] of [[-9,-5.5,1.35,.55],[9,-5.8,1.3,.46],[-7.5,-14,1.8,.65],[6.9,-29,1.7,.48]]){
  const shape=new THREE.Shape(),rand=mulberry32(91+Math.abs(x*13));
  for(let k=0;k<20;k++){const a=k/20*TAU,r=.77+rand()*.23;k?shape.lineTo(Math.cos(a)*r,Math.sin(a)*r):shape.moveTo(Math.cos(a)*r,Math.sin(a)*r);}
  shape.closePath();const mesh=new THREE.Mesh(rvEnvOwn(new THREE.ShapeGeometry(shape)),material);
  mesh.rotation.x=-Math.PI/2;mesh.scale.set(sx,sz,1);mesh.position.set(x,RV_ENV_CONFIG.reflection.floorY,z);scene.add(mesh);RV_ENV.puddles.push(mesh);
 }
 for(const mesh of RV_ENV.puddles){const uv=mesh.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*.5+.5,uv.getY(i)*.5+.5);uv.needsUpdate=true;}
 // A one-pixel owned fallback keeps sampler completeness on WebGL1 before the first capture.
 const data=new Uint8Array([11,10,9,255]);const fallback=rvEnvOwn(new THREE.DataTexture(data,1,1,THREE.RGBAFormat));fallback.needsUpdate=true;
 material.uniforms.uReflection.value=fallback;
}
function rvEnvFog(){
 if(!RV_ENV_CONFIG.fog.enabled)return;
 const c=cvs(128,128),ctx=c.getContext('2d'),r=mulberry32(273);
 ctx.clearRect(0,0,128,128);
 for(let i=0;i<24;i++){const x=26+r()*76,y=26+r()*76,radius=12+r()*31,g=ctx.createRadialGradient(x,y,0,x,y,radius);g.addColorStop(0,'rgba(210,204,187,.11)');g.addColorStop(1,'rgba(210,204,187,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);}
 const texture=rvEnvOwn(tx(c)),geo=rvEnvOwn(new THREE.PlaneGeometry(1,1));
 const sites=[{p:[11.5,5.6,-6.2],s:[2.6,1.35],drift:[-.22,.12,.55]},
  {p:[-9,.43,-6.5],s:[2.1,.8],drift:[.75,.10,.25]},
  {p:[9,.4,-6.5],s:[1.6,.65],drift:[-.65,.12,.30]},
  {p:[-8.75,7.5,-23],s:[2.7,1.5],drift:[.4,-.28,.12]}];
 const layers=LOW||COARSE?2:3;
 sites.forEach((site,index)=>{for(let layer=0;layer<layers;layer++){
  const mat=rvEnvOwn(new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:0,depthWrite:false,depthTest:true,color:0xe8e3d8,side:THREE.DoubleSide}));
  const mesh=new THREE.Mesh(geo,mat);mesh.renderOrder=3;scene.add(mesh);
  RV_ENV.fog.push({mesh,site,index,phase:layer/layers});
 }});
}
function rvEnvConsolidate(){
 if(!RV_ENV_CONFIG.consolidate)return;
 const skip=new Set([RV.seam,...RV.signals]),groups=new Map();
 for(const mesh of scene.children.slice()){
  if(!mesh.isMesh||mesh.geometry!==RVBOX||skip.has(mesh)||!mesh.visible)continue;
  const key=mesh.material.uuid+':'+mesh.castShadow+':'+mesh.receiveShadow;
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(mesh);
 }
 for(const list of groups.values()){
  if(list.length<3)continue;
  const first=list[0],batch=new THREE.InstancedMesh(RVBOX,first.material,list.length);
  batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;
  // The vendored legacy renderer does not compute InstancedMesh bounds; these room-spanning groups must not cull.
  batch.frustumCulled=false;
  list.forEach((mesh,index)=>{mesh.updateMatrix();batch.setMatrixAt(index,mesh.matrix);scene.remove(mesh);});
  batch.instanceMatrix.needsUpdate=true;scene.add(batch);RV_ENV.batches.push(batch);
  RV_ENV.stats.consolidated+=list.length;RV_ENV.stats.batches++;
 }
 // Speaker drivers were authored with identical individual materials; share one program/material.
 const driver=RV.cones[0]?.cone.material;
 if(driver)for(const item of RV.cones){if(item.cone.material!==driver){item.cone.material.dispose();item.cone.material=driver;}}
}
function rvEnvUpdate(){
 const time=WORLD.uT.value,dawn=smooth(...RV_CONFIG.dawn,RIG.smooth);
 if(RV_ENV.puddleMaterial)RV_ENV.puddleMaterial.uniforms.uDawn.value=dawn;
 for(const item of RV_ENV.fog){
  const {mesh,site,phase,index}=item,cycle=(time*RV_ENV_CONFIG.fog.speed+phase+index*.17)%1;
  mesh.position.set(site.p[0]+site.drift[0]*cycle,site.p[1]+site.drift[1]*cycle,site.p[2]+site.drift[2]*cycle);
  mesh.scale.set(site.s[0]*(.65+cycle*.8),site.s[1]*(.7+cycle*.5),1);
  mesh.quaternion.copy(camera.quaternion);
  const base=LOW||COARSE?RV_ENV_CONFIG.fog.mobileOpacity:RV_ENV_CONFIG.fog.opacity;
  mesh.material.opacity=base*Math.sin(cycle*Math.PI)*(1+dawn*.15);
  mesh.visible=PERF.scale>.61||index<2;
 }
}
function rvEnvReflection(){
 const E=RV_ENV,cfg=RV_ENV_CONFIG.reflection,mat=E.puddleMaterial;
 if(!mat||E.disposed)return;
 E.frame++;
 const allowed=cfg.enabled&&!LOW&&!COARSE&&PERF.scale>=cfg.minScale&&renderer.getRenderTarget&&renderer.setRenderTarget&&renderer.getViewport;
 if(!allowed){mat.uniforms.uLive.value=0;E.mode='procedural';return;}
 // The exterior puddles matter at the entrance and the return view; interior patches use the same plane.
 if(camera.position.y<cfg.floorY+.1){mat.uniforms.uLive.value=0;E.mode='procedural';return;}
 if(E.reflectionValid&&!RV.paused&&E.frame-E.lastCapture<cfg.every)return;
 const width=renderer.domElement.width||512,height=renderer.domElement.height||512;
 const cap=Math.min(.35,cfg.maxSize/Math.max(width,height));
 const w=Math.max(128,Math.round(width*cap));
 const h=Math.max(128,Math.round(height*cap));
 if(!E.reflection){
  E.reflection=rvEnvOwn(new THREE.WebGLRenderTarget(w,h,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,
   format:THREE.RGBAFormat,type:WANT_POST?THREE.HalfFloatType:THREE.UnsignedByteType,depthBuffer:true,stencilBuffer:false}));
  E.reflectionCamera=new THREE.PerspectiveCamera();
 }else if(E.reflection.width!==w||E.reflection.height!==h)E.reflection.setSize(w,h);
 const mirror=E.reflectionCamera;
 scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 mirror.copy(camera);mirror.position.copy(camera.position);mirror.position.y=2*cfg.floorY-camera.position.y;
 const direction=new THREE.Vector3();camera.getWorldDirection(direction);
 const look=camera.position.clone().add(direction);look.y=2*cfg.floorY-look.y;
 mirror.up.set(0,-1,0);mirror.lookAt(look);mirror.updateMatrixWorld(true);
 mirror.projectionMatrix.copy(camera.projectionMatrix);mirror.matrixWorldInverse.copy(mirror.matrixWorld).invert();
 // Eric Lengyel oblique near-plane projection (same geometry as Three's Reflector).
 const plane=new THREE.Plane(new THREE.Vector3(0,1,0),-cfg.floorY).applyMatrix4(mirror.matrixWorldInverse);
 const clip=new THREE.Vector4(plane.normal.x,plane.normal.y,plane.normal.z,plane.constant),p=mirror.projectionMatrix.elements;
 const q=new THREE.Vector4((Math.sign(clip.x)+p[8])/p[0],(Math.sign(clip.y)+p[9])/p[5],-1,(1+p[10])/p[14]);
 clip.multiplyScalar(2/clip.dot(q));p[2]=clip.x;p[6]=clip.y;p[10]=clip.z+1-cfg.clipBias;p[14]=clip.w;
 E.textureMatrix.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse);
 const previous=renderer.getRenderTarget(),viewport=renderer.getViewport(new THREE.Vector4()).clone();
 const scissor=renderer.getScissor?renderer.getScissor(new THREE.Vector4()).clone():null;
 const scissorTest=renderer.getScissorTest?renderer.getScissorTest():false;
 const shadowUpdate=renderer.shadowMap.autoUpdate;
 const hidden=[...E.puddles,...E.fog.map(f=>f.mesh),RV.reflection].filter(Boolean).map(o=>[o,o.visible]);
 try{
  hidden.forEach(([o])=>o.visible=false);renderer.shadowMap.autoUpdate=false;
  renderer.setRenderTarget(E.reflection);if(renderer.setScissorTest)renderer.setScissorTest(false);
  renderer.clear(true,true,false);renderer.render(scene,mirror);
  mat.uniforms.uReflection.value=E.reflection.texture;mat.uniforms.uLive.value=1;
  E.lastCapture=E.frame;E.reflectionValid=true;E.mode='planar';
 }finally{
  hidden.forEach(([o,visible])=>o.visible=visible);renderer.shadowMap.autoUpdate=shadowUpdate;
  renderer.setRenderTarget(previous);renderer.setViewport(viewport);
  if(scissor&&renderer.setScissor)renderer.setScissor(scissor);if(renderer.setScissorTest)renderer.setScissorTest(scissorTest);
 }
}
RV_ENV.invalidate=function(){RV_ENV.reflectionValid=false;};
RV_ENV.dispose=function(){if(RV_ENV.disposed)return;RV_ENV.disposed=true;for(const r of RV_ENV.resources)r.dispose();RV_ENV.resources.clear();};
const rvEnvBuildShell=buildShell;buildShell=function(){rvEnvBuildShell();rvEnvInfrastructure();rvEnvLightMaterials();rvEnvPuddles();};
const rvEnvAtmosphere=rvAtmosphere;rvAtmosphere=function(){rvEnvAtmosphere();
 // Keep legacy handles valid for updateWorld while replacing broad camera-facing haze with vent emitters.
 WORLD.haze.forEach(m=>{m.visible=false;});RV.reflection.visible=false;
 rvEnvFog();rvEnvConsolidate();
};
const rvEnvUpdateWorld=updateWorld;updateWorld=function(dt){rvEnvUpdateWorld(dt);rvEnvUpdate();};
const rvEnvRender=render;render=function(){rvEnvReflection();rvEnvRender();};
const rvEnvResize=resize;resize=function(){rvEnvResize();RV_ENV.invalidate();};
