/* Original bitmap, reversible scroll envelopes, one shared clock. No new loop. */
const RV_CHOREO={ready:false,disposed:false,geometry:null,logo:null,original:null,
 uniforms:{uRVFloat:{value:0},uRVSeparate:{value:0},uRVEmphasis:{value:0}},
 state:{progress:0,time:0,float:0,separation:0,emphasis:0,phase:'settled'}};
RV.choreography=RV_CHOREO;
function rvChoreoEase(a,b,x){const q=Math.max(0,Math.min(1,(x-a)/(b-a)));return q*q*(3-2*q);}
function rvChoreoEnvelope(a,b,c,d,x){return rvChoreoEase(a,b,x)*(1-rvChoreoEase(c,d,x));}
function rvChoreoSample(progress,time=0,reduced=false,out={}){
 const p=Number.isFinite(progress)?Math.max(0,Math.min(5,progress)):0;
 const window=RV.camera?.windows.logo||[0,1],span=window[1]-window[0];
 const local=(p-window[0])/span;
 out.progress=p;out.time=Number.isFinite(time)?time:0;
 out.float=reduced?0:1-rvChoreoEase(.92,1.08,local);
 // Two small exhale/settle gestures while every logo corner is still framed.
 out.separation=reduced?0:Math.max(rvChoreoEnvelope(.14,.30,.36,.57,local),
  .65*rvChoreoEnvelope(.63,.76,.80,.96,local));
 // One continuous, scroll-driven light emphasis, never an autonomous strobe.
 out.emphasis=reduced?0:rvChoreoEnvelope(.30,.39,.42,.53,local);
 out.phase=out.separation>.001?'separating':local>1?'departed':'settled';
 return out;
}
RV_CHOREO.sample=rvChoreoSample;
function rvChoreoGeometry(){
 const positions=[],normals=[],uvs=[],cells=[];
 const columns=16,rows=2,sx=4,sy=3;
 function vertex(ix,iy,cx,cy,seed){
  const u=ix/(columns*sx),v=iy/(rows*sy);
  positions.push((u-.5)*10.25,(v-.5)*1.48,0);normals.push(0,0,1);uvs.push(u,v);cells.push(cx,cy,seed);
 }
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const cx=(col+.5)/columns*2-1,cy=(row+.5)/rows*2-1;
  const seed=((col*17+row*29)%31)/30;
  for(let y=0;y<sy;y++)for(let x=0;x<sx;x++){
   const ix=col*sx+x,iy=row*sy+y;
   vertex(ix,iy,cx,cy,seed);vertex(ix+1,iy,cx,cy,seed);vertex(ix,iy+1,cx,cy,seed);
   vertex(ix+1,iy,cx,cy,seed);vertex(ix+1,iy+1,cx,cy,seed);vertex(ix,iy+1,cx,cy,seed);
  }
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 g.setAttribute('aRVCell',new THREE.Float32BufferAttribute(cells,3));
 g.computeBoundingBox();g.boundingBox.expandByScalar(.16);g.computeBoundingSphere();g.boundingSphere.radius+=.16;
 return g;
}
function rvChoreoInitLogo(){
 const C=RV_CHOREO,m=RV.logo;if(C.disposed||C.ready||!m?.material?.map)return;
 const mat=m.material;
 C.logo=m;C.original={geometry:m.geometry,onBeforeCompile:mat.onBeforeCompile,cacheKey:mat.customProgramCacheKey};
 C.geometry=rvChoreoGeometry();m.geometry=C.geometry;
 mat.onBeforeCompile=function(shader,renderer){
  C.original.onBeforeCompile.call(this,shader,renderer);
  shader.uniforms.uRVTime=WORLD.uT;
  Object.assign(shader.uniforms,C.uniforms);
  shader.vertexShader=`uniform float uRVTime; uniform float uRVFloat; uniform float uRVSeparate;
attribute vec3 aRVCell;
`+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
float rvWave = sin(position.x*.74 + uRVTime*.43)*.65
             + sin(position.x*1.41 - position.y*1.8 - uRVTime*.29)*.35;
float rvEdge = 1.0 - pow(abs(uv.x*2.0-1.0),4.0);
transformed.z += uRVFloat*(.025 + .018*rvWave*rvEdge);
transformed.y += uRVFloat*.009*sin(uRVTime*.37 + position.x*.24)*rvEdge;
transformed.x += uRVSeparate*aRVCell.x*.042;
transformed.y += uRVSeparate*aRVCell.y*.024;
transformed.z += uRVSeparate*(.035 + aRVCell.z*.060);
`);
  shader.fragmentShader='uniform float uRVEmphasis;\n'+shader.fragmentShader.replace('#include <color_fragment>',
   '#include <color_fragment>\n diffuseColor.rgb *= 1.0 + .16*uRVEmphasis;');
 };
 mat.customProgramCacheKey=function(){return 'ravers-original-logo-choreography-v1';};
 mat.needsUpdate=true;C.ready=true;rvChoreoUpdate();
}
function rvChoreoUpdate(){
 const C=RV_CHOREO;if(C.disposed)return;
 const s=rvChoreoSample(RIG.smooth,WORLD.uT.value,REDUCE,C.state);
 C.uniforms.uRVFloat.value=s.float;C.uniforms.uRVSeparate.value=s.separation;C.uniforms.uRVEmphasis.value=s.emphasis;
 // The base world recomputes intensity first, so this never compounds on rewind.
 if(RV.seamLight)RV.seamLight.intensity*=1+.08*s.emphasis;
}
RV_CHOREO.dispose=function(){
 const C=RV_CHOREO;if(C.disposed)return;C.disposed=true;
 if(C.ready){const m=C.logo;m.geometry=C.original.geometry;
  m.material.onBeforeCompile=C.original.onBeforeCompile;m.material.customProgramCacheKey=C.original.cacheKey;
  m.material.needsUpdate=true;C.geometry.dispose();C.geometry=null;C.ready=false;
 }
};
// Resolve only after the original loader has installed the actual uploaded map.
const rvChoreoLoadLogo=rvLogo;
rvLogo=async function(){const result=await rvChoreoLoadLogo();rvChoreoInitLogo();return result;};
const rvChoreoUpdateWorld=updateWorld;
updateWorld=function(dt){rvChoreoUpdateWorld(dt);rvChoreoUpdate();};
