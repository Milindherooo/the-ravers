/* RAVERS derivative: authored Kage material helpers, glyph renderer, rig,
   live-view compositor and HDR post pipeline are retained. The venue geometry,
   light rig and editorial composition below are original.
   world.js owns construction and the base (steady) timeline state. Shading,
   analytic light pools, sky, wet ground and reflections live in environment.js. */
const RV={paused:REDUCE, doors:[], cones:[], banners:[], signals:[], notices:[], audio:null, disposed:false};
// RV_CONFIG is the timeline authority. Windows are in RIG.smooth progress (0-5).
const RV_CONFIG={tempo:140,doorOpen:[.35,1.2],spill:[.38,.80],dawn:[3.55,4.35],beatOut:[3.40,3.70],redOut:[3.55,4.10],
 dawnSpill:[3.70,4.35],sodiumOff:[4.25,4.50],travel:[.12,.86],damping:6.2,camera:[
 {p:[6.8,2.4,18],t:[0,5.4,-8],fov:47},{p:[0,2.3,-1.5],t:[0,3.7,-24],fov:48},
 {p:[0,3.5,-16],t:[0,4,-32],fov:54},{p:[5.5,3.2,-24],t:[-1.5,4,-36],fov:52},
 {p:[-1,4,-28],t:[0,5,2],fov:52},{p:[-2,3,-20],t:[0,5,2],fov:54}]};
CAM.splice(0,CAM.length,...RV_CONFIG.camera);

/* The light rig. Only `key` is a realtime light (plus the hemisphere skyglow);
   every other source is an analytic pool evaluated in environment.js. Positions
   are world metres; colours are sRGB hex; intensities are the steady base values
   that the choreographer may multiply (never accumulate) after updateWorld. */
const RV_RIG={
 sodium:{pole:[-11,0,-3],head:[-9.6,7.9,-3],color:0xff9b3d,intensity:3.4,radius:6},
 road:{pole:[6.5,0,26.5],head:[5.1,8.4,26.5],color:0xff9b3d,intensity:3.4,radius:6.5},
 sconce:{pos:[-5,6.18,-7.12],color:0xffd2a1,intensity:7,radius:1.8},
 sign:{min:[-5.1,10.7,-7.1],max:[5.1,12.1,-7.1],color:0xf4f1ea,intensity:2.2,radius:2.4},
 seam:{color:0xe8232a,intensity:2.4,radius:.3},
 spill:{color:0xe8232a,intensity:3.2,glow:.55},
 back:{a:[-7.5,.7,-40.6],b:[7.5,.7,-40.6],color:0xe8232a,intensity:3.4,range:16,bounce:[0,.8,-33.4]},
 tube:{a:[-2.6,7.08,-36.62],b:[2.6,7.08,-36.62],color:0xe8232a,intensity:7,range:9},
 lamp:{pos:[.86,1.39,-31.8],color:0xffcf9a,intensity:2.6,range:2.5},
 strip:{a:[-1.15,.96,-31.2],b:[1.15,.96,-31.2],color:0xffcf9a,intensity:.5,range:1.2},
 sun:{azimuth:14,elevation:[4,7],color:[0xffc27a,0xffd9a8],intensity:[2.4,2.5]},
 hemi:{night:.07,dawn:.35}
};
const RVBOX=new THREE.BoxGeometry(1,1,1),RV_TX=LOW?.5:1; // canvas texture scale: LOW halves the large maps
RV.config=RV_CONFIG;RV.rig=RV_RIG;WORLD.rv=RV; // handles for tests and diagnostics (window.__ravers.WORLD.rv)
let mats;
const rvLin=hex=>new THREE.Color(hex).convertSRGBToLinear();
// Inverse of the comp pass's ACES fit, so authored display colours survive exposure and tone mapping.
function rvAcesInv(y){let a=0,b=80;y=Math.min(y,.995);for(let i=0;i<48;i++){const m=(a+b)/2,v=m*(2.51*m+.03)/(m*(2.43*m+.59)+.14);if(v<y)a=m;else b=m;}return (a+b)/2;}
// HDR linear colour that displays as `hex` at the given post exposure.
// gain scales the solved HDR value (brighter, same hue); it never pushes a channel past the curve.
function rvShow(hex,exposure=.9,gain=1){const c=rvLin(hex),k=gain/exposure;return new THREE.Color(rvAcesInv(c.r)*k,rvAcesInv(c.g)*k,rvAcesInv(c.b)*k);}
function rvBox(w,h,d,x,y,z,mat,parent=scene){const m=new THREE.Mesh(RVBOX,mat);m.scale.set(w,h,d);m.position.set(x,y,z);m.castShadow=!LOW;m.receiveShadow=true;parent.add(m);return m;}
function rvTubeGeo(points,r,seg=8){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return new THREE.TubeGeometry(curve,Math.max(8,points.length*seg),r,6,false);}
function rvTube(points,r,mat,parent=scene){const m=new THREE.Mesh(rvTubeGeo(points,r),mat);parent.add(m);return m;}
function rvBatch(parts,mat,parent=scene){const g=mergeGeos(parts),m=new THREE.Mesh(g,mat);m.castShadow=!LOW;m.receiveShadow=true;parent.add(m);return m;}
// Box with box-projected world UVs (tile metres), so textures keep their real scale on any size.
function rvG(w,h,d,x,y,z,tile=0){const g=new THREE.BoxGeometry(w,h,d).translate(x,y,z);if(tile)rvWorldUV(g,tile);return g;}
function rvIndexed(g){if(!g.index){const n=g.attributes.position.count,idx=new (n>65535?Uint32Array:Uint16Array)(n);for(let i=0;i<n;i++)idx[i]=i;g.setIndex(new THREE.BufferAttribute(idx,1));}return g;}
function rvWorldUV(g,tile){const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));let u,v;if(az>=ax&&az>=ay){u=p.getX(i);v=p.getY(i);}else if(ax>=ay){u=p.getZ(i);v=p.getY(i);}else{u=p.getX(i);v=p.getZ(i);}uv.setXY(i,u/tile,v/tile);}uv.needsUpdate=true;return g;}

/* ------------------------------------------------------------ surfaces
   Material families from the world bible. Colour maps are sRGB canvases with
   causal wear only (no fbm as surface colour); data maps stay linear. */
function rvCanvasTex(c,{repeat=true,srgb=true}={}){const t=tx(c,{wrap:repeat?THREE.RepeatWrapping:THREE.ClampToEdgeWrapping,srgb});return t;}
function rvTrimix(){
 // One 3.6 m slab per tile: saw cuts on two edges, power-trowel burnish, fine aggregate.
 const N=512*RV_TX,k=N/1024,c=cvs(N,N),x=c.getContext('2d'),r=mulberry32(7741);
 x.fillStyle='#57544f';x.fillRect(0,0,N,N);
 for(let i=0;i<5200*k;i++){const v=r();x.fillStyle=v>.5?'rgba(120,116,108,.10)':'rgba(40,38,35,.10)';x.fillRect(r()*N,r()*N,1+r(),1+r());}
 x.lineWidth=14*k;for(let i=0;i<46;i++){const cx=r()*N,cy=r()*N,rad=(60+r()*150)*k;x.strokeStyle=`rgba(${r()>.5?'98,95,89':'74,72,67'},.035)`;x.beginPath();x.arc(cx,cy,rad,r()*6,r()*6+1.6+r()*2);x.stroke();}
 // Saw cut: 5 mm kerf, darker, with a faint chipped lip.
 x.fillStyle='rgba(18,17,15,.85)';x.fillRect(0,0,N,2);x.fillRect(0,0,2,N);x.fillStyle='rgba(30,29,27,.30)';x.fillRect(0,2,N,1);x.fillRect(2,0,1,N);
 const D=256*RV_TX,q=D/256,rough=cvs(D,D),rx=rough.getContext('2d'),rr=mulberry32(19);rx.fillStyle='rgb(220,220,220)';rx.fillRect(0,0,D,D);
 rx.lineWidth=7*q;for(let i=0;i<38;i++){rx.strokeStyle=`rgba(150,150,150,${.10+rr()*.10})`;rx.beginPath();rx.arc(rr()*D,rr()*D,(15+rr()*40)*q,rr()*6,rr()*6+2);rx.stroke();}
 rx.fillStyle='rgb(255,255,255)';rx.fillRect(0,0,D,2);rx.fillRect(0,0,2,D);
 const h=cvs(D,D),hx=h.getContext('2d');hx.fillStyle='#808080';hx.fillRect(0,0,D,D);hx.fillStyle='#202020';hx.fillRect(0,0,D,2);hx.fillRect(0,0,2,D);
 return {map:c,normal:normalFromHeight(h,1.2),rough};
}
function rvConcreteTex(){
 // Cast concrete #6f6b64, 2.4 m tile: shutter-board joints, blowholes, faint lifts. Streaks are causal, in the shader.
 const N=512*RV_TX,c=cvs(N,N),x=c.getContext('2d'),r=mulberry32(311);x.fillStyle='#6f6b64';x.fillRect(0,0,N,N);
 for(let i=0;i<6;i++){x.fillStyle=`rgba(${r()>.5?'120,116,108':'92,89,83'},.12)`;x.fillRect(0,i*N/6,N,N/6);}
 x.fillStyle='rgba(40,38,34,.22)';for(let i=1;i<6;i++)x.fillRect(0,i*N/6-1,N,2);
 for(let i=0;i<900*RV_TX;i++){x.fillStyle=`rgba(30,29,26,${.15+r()*.3})`;const s=(.6+r()*1.8)*RV_TX;x.beginPath();x.arc(r()*N,r()*N,s,0,TAU);x.fill();}
 for(let i=0;i<2600;i++){x.fillStyle=r()>.5?'rgba(140,135,126,.08)':'rgba(60,58,53,.08)';x.fillRect(r()*N,r()*N,1,1);}
 return rvCanvasTex(c);
}
function rvGalvalumeTex(){
 // Galvalume #7d817f over a 4 m x 14 m panel field (u = x/4, v = y/14). Water streaks from the
 // top flashing; rust only under fastener rows and in the bottom 30 cm (<=2% of area).
 const W=128,H=512,c=cvs(W,H),x=c.getContext('2d'),r=mulberry32(901);x.fillStyle='#7d817f';x.fillRect(0,0,W,H);
 for(let i=0;i<70;i++){const sx=r()*W,w=.5+r()*2,len=H*(.08+r()*.3),g=x.createLinearGradient(0,0,0,len);g.addColorStop(0,'rgba(22,22,20,.55)');g.addColorStop(1,'rgba(22,22,20,0)');x.fillStyle=g;x.fillRect(sx,0,w,len);}
 for(let i=0;i<40;i++){const sx=r()*W,top=H*(.15+r()*.6),len=20+r()*80,g=x.createLinearGradient(0,top,0,top+len);g.addColorStop(0,'rgba(28,28,26,.25)');g.addColorStop(1,'rgba(28,28,26,0)');x.fillStyle=g;x.fillRect(sx,top,1+r()*2,len);}
 for(const yy of [.17,.37,.56,.75,.93]){const py=H*(1-yy);for(let px=4;px<W;px+=8){x.fillStyle='rgba(30,30,30,.7)';x.fillRect(px-.5,py-.5,1.5,1.5);if(r()<.35){const g=x.createLinearGradient(0,py,0,py+9);g.addColorStop(0,'rgba(120,64,30,.55)');g.addColorStop(1,'rgba(120,64,30,0)');x.fillStyle=g;x.fillRect(px-.5,py+.5,1,9);}}}
 const g=x.createLinearGradient(0,H-11,0,H);g.addColorStop(0,'rgba(110,62,32,0)');g.addColorStop(1,'rgba(110,62,32,.45)');x.fillStyle=g;x.fillRect(0,H-11,W,11);
 return rvCanvasTex(c);
}
function rvDoorTex(flip){
 // Painted steel #141515; primer #5e5e58 shows at the edges, the handle and the kick zone.
 const W=128,H=280,c=cvs(W,H),x=c.getContext('2d'),r=mulberry32(flip?77:78);x.fillStyle='#141515';x.fillRect(0,0,W,H);
 const wear=(px,py,w,h,a)=>{for(let i=0;i<w*h*.06;i++){x.fillStyle=`rgba(94,94,88,${a*(.3+r()*.7)})`;x.fillRect(px+r()*w,py+r()*h,1+r()*2,1+r()*1.5);}};
 wear(0,0,W,2,.8);wear(0,H-2,W,2,.8);wear(0,0,2,H,.8);wear(W-2,0,2,H,.8);
 wear(0,H-10,W,10,.55);for(let i=0;i<30;i++){x.strokeStyle=`rgba(94,94,88,${.15+r()*.3})`;x.beginPath();const sx=r()*W,sy=H-2-r()*8;x.moveTo(sx,sy);x.lineTo(sx+4+r()*12,sy-r()*2);x.stroke();}
 const hx=flip?W-13:3;wear(hx,H*.53,10,24,.55);
 for(let i=0;i<3;i++){const y=[H*.12,H*.52,H*.88][i];x.fillStyle='rgba(8,8,8,.5)';x.fillRect(0,y,W,2);}
 return rvCanvasTex(c,{repeat:false});
}
function rvPrint(lines,{paper=true,seed=4,w=384,h=576,ink,bg,pad=.07,lead=.96,torn=false}={}){
 // A single-sided wheatpaste or printed panel: the words only. No eyebrow, rule, caption or index.
 const c=cvs(w,h),x=c.getContext('2d'),r=mulberry32(seed);x.fillStyle=bg||(paper?'#d9d4c7':'#181917');x.fillRect(0,0,w,h);
 if(paper){for(let i=0;i<70;i++){const px=r()*w,py=r()*h,len=10+r()*50;x.strokeStyle=`rgba(${r()>.5?'255,255,250':'90,86,78'},${.08+r()*.10})`;x.lineWidth=1+r()*1.5;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+len*.5,py+(r()-.5)*12,px+len,py+(r()-.5)*8);x.stroke();}
  for(let i=0;i<26;i++){const px=r()*w,py=r()*h,rad=3+r()*9,gr=x.createRadialGradient(px,py,0,px,py,rad);gr.addColorStop(0,'rgba(255,255,250,.22)');gr.addColorStop(1,'rgba(255,255,250,0)');x.fillStyle=gr;x.fillRect(px-rad,py-rad,rad*2,rad*2);}}
 x.fillStyle=ink||(paper?'#151612':'#d5d0c3');x.textBaseline='alphabetic';
 const usable=w*(1-2*pad),fh=h*(1-2*pad)/lines.length;let size=999;
 for(const line of lines){x.font='100px Anton';const m=x.measureText(line);size=Math.min(size,usable/m.width*100,fh/1.02);}
 x.font=size+'px Anton';const asc=x.measureText('H').actualBoundingBoxAscent||size*.72,step=fh;
 lines.forEach((line,i)=>{const top=h*pad+i*step+(step-asc)*.5;x.fillText(line,w*pad,top+asc);});
 if(paper){const g=x.createLinearGradient(0,h*.84,0,h);g.addColorStop(0,'rgba(60,56,48,0)');g.addColorStop(1,'rgba(60,56,48,.42)');x.fillStyle=g;x.fillRect(0,h*.84,w,h*.16);}
 if(torn){x.globalCompositeOperation='destination-out';for(const [cx,cy] of [[0,0],[w,0],[0,h],[w,h]]){if(r()<.35)continue;x.beginPath();x.moveTo(cx,cy);const a=18+r()*46,b=18+r()*46;x.lineTo(cx+(cx?-a:a),cy);for(let k=1;k<5;k++)x.lineTo(cx+(cx?-a:a)*(1-k/5)+(r()-.5)*6,cy+(cy?-b:b)*(k/5)+(r()-.5)*6);x.lineTo(cx,cy+(cy?-b:b));x.closePath();x.fill();}x.globalCompositeOperation='source-over';}
 const t=rvCanvasTex(c,{repeat:false});t.userData={capFraction:asc/h};return t;
}
function rvPanel(lines,w,h,x,y,z,opt={},parent=scene){
 const map=rvPrint(lines,opt),mat=new THREE.MeshStandardMaterial({map,roughness:1,metalness:0,alphaTest:opt.torn?.5:0,side:THREE.FrontSide});
 const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);m.position.set(x,y,z);m.receiveShadow=true;parent.add(m);m.userData.capHeight=map.userData.capFraction*h;return m;
}
function rvStencil(){
 // Spray-painted "140": white through a stencil, so the counters keep their bridges; soft overspray.
 const W=256,H=128,c=cvs(W,H),x=c.getContext('2d');x.clearRect(0,0,W,H);
 const paint=cvs(W,H),p=paint.getContext('2d');p.fillStyle='#fff';p.font='105px Anton';p.textBaseline='alphabetic';
 const m=p.measureText('140'),left=(W-m.width)/2,asc=m.actualBoundingBoxAscent||76,base=(H+asc)/2;p.fillText('140',left,base);
 p.globalCompositeOperation='destination-out';const w1=p.measureText('1').width,w4=p.measureText('4').width,w0=p.measureText('0').width;
 p.fillRect(left+w1+w4*.40,base-asc*.62,w4*.12,asc*.10);p.fillRect(left+w1+w4+w0*.44,base-asc-4,w0*.12,asc*.24);p.fillRect(left+w1+w4+w0*.44,base-asc*.2,w0*.12,asc*.24);
 x.filter='blur(2.5px)';x.globalAlpha=.22;x.drawImage(paint,0,0);x.filter='none';x.globalAlpha=1;x.drawImage(paint,0,0);
 const t=rvCanvasTex(c,{repeat:false});return t;
}

/* ------------------------------------------------------------ light rig */
buildLights=function(){
 const R=RV_RIG;
 const hemi=new THREE.HemisphereLight(0xffffff,0xffffff,R.hemi.night);scene.add(hemi);RV.hemi=hemi;
 // The single shadowed directional: the yard sodium at night (environment.js turns it into a
 // falloff pool from the head), rotating to the low sun at dawn.
 const key=new THREE.DirectionalLight(R.sodium.color,R.sodium.intensity);key.position.set(...R.sodium.head);key.target.position.set(-4,1.5,-7.6);
 scene.add(key,key.target);key.castShadow=WANT_SHADOW;
 if(WANT_SHADOW){key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:.5,far:110});key.shadow.bias=-.0005;key.shadow.normalBias=.03;}
 WORLD.key=key;RV.key=key;RV.lastKey=new THREE.Vector3();
 // Legacy handles: intensity writes go straight to the analytic uniforms, so a later
 // multiplicative wrapper (choreography) still lands where it is rendered.
 const handle=name=>({get intensity(){return RV.environment.uniforms[name].value;},set intensity(v){RV.environment.uniforms[name].value=v;}});
 RV.seamLight=handle('uSeam');RV.backLight=handle('uBack');
};

/* ------------------------------------------------------------ the shell */
buildShell=function(){
 const concrete=new THREE.MeshStandardMaterial({map:rvConcreteTex(),roughness:.9,metalness:0});concrete.defines={RV_CONCRETE:''};
 const galv=new THREE.MeshStandardMaterial({map:rvGalvalumeTex(),roughness:.45,metalness:.9});galv.defines={RV_GALV:''};
 const steel=new THREE.MeshStandardMaterial({color:rvLin(0x1b1c1d),roughness:.6,metalness:.7});steel.defines={RV_STRUCT:''};
 const dark=new THREE.MeshStandardMaterial({color:rvLin(0x141515),roughness:.55,metalness:0});
 const edge=new THREE.MeshStandardMaterial({color:rvLin(0x5e5e58),roughness:.5,metalness:.35});
 const black=new THREE.MeshStandardMaterial({color:rvLin(0x0f0f0f),roughness:.8,metalness:0});
 const glass=new THREE.MeshStandardMaterial({color:rvLin(0x0b0c0c),roughness:.12,metalness:0});
 const alu=new THREE.MeshStandardMaterial({color:rvLin(0xa7a8a4),roughness:.35,metalness:1});
 const red=new THREE.MeshBasicMaterial({color:hdr(2.5,.022,.034),toneMapped:false});
 mats={concrete,galv,steel,dark,edge,black,glass,alu,red};
 scene.fog.color.set(0x05040a);scene.fog.density=.010;scene.background.set(0x050403);
 const fT=rvTrimix(),fm=surface(fT,[160/3.6,160/3.6],{color:0xffffff,normal:.35,roughness:1,metalness:0});fm.defines={RV_FLOOR:''};
 fm.map.offset.set(.5-((80)/3.6)%1,.5);fm.normalMap.offset.copy(fm.map.offset);fm.roughnessMap.offset.copy(fm.map.offset);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(160,160),fm);floor.rotation.x=-Math.PI/2;floor.position.set(0,-.025,-10);floor.receiveShadow=true;scene.add(floor);WORLD.floor=floor;
 rvFacade();
 // Hall: concrete walls, structural steel frame, galvalume roof with translucent sheets.
 const walls=[rvG(.4,10,36.5,-11,5,-26.25,2.4),rvG(.4,10,36.5,11,5,-26.25,2.4),rvG(22.4,10,.4,0,5,-44.3,2.4)];rvBatch(walls,concrete);
 rvBox(22,.15,36.5,0,10.08,-26.25,dark);
 const structure=[],fasteners=[];for(let z=-12;z>=-42;z-=5){for(const side of [-1,1]){const x=side*10;structure.push(new THREE.BoxGeometry(.15,10,.65).translate(x,5,z));for(const dx of [-.22,.22])structure.push(new THREE.BoxGeometry(.1,10,.7).translate(x+dx,5,z));structure.push(new THREE.BoxGeometry(.9,.1,1).translate(x,.06,z));for(const dx of [-.32,.32])for(const dz of [-.35,.35])fasteners.push(new THREE.BoxGeometry(.08,.07,.08).translate(x+dx,.15,z+dz));}structure.push(new THREE.BoxGeometry(20,.3,.4).translate(0,9.6,z));for(let j=-9;j<10;j+=2){const b=new THREE.BoxGeometry(2.5,.085,.085);b.rotateZ((j%4===-1?1:-1)*.48);b.translate(j+1,9.1,z);structure.push(b);}structure.push(new THREE.BoxGeometry(20,.12,.2).translate(0,8.65,z));}
 rvBatch(structure,steel);rvBatch(fasteners,steel);
 const tray=[];for(const x of [-8,8]){tray.push(rvTubeGeo([[x,9,-8.6],[x,8.9,-16],[x,8.85,-28],[x,8.9,-42]],.07));for(let z=-12;z>-42;z-=4)tray.push(new THREE.BoxGeometry(.22,.04,.08).translate(x,9,z));}rvBatch(tray,dark);
 // Translucent roof sheets: they pale first at dawn (environment drives their colour).
 const sheets=[];for(const x of [-6.2,0,6.2])for(let z=-9.4;z>-43;z-=4.2)sheets.push(new THREE.PlaneGeometry(1.05,3.9).rotateX(Math.PI/2).translate(x,9.99,z-1.95));
 const sheetMat=new THREE.MeshBasicMaterial({color:0x000000,fog:true});const roofSheets=new THREE.Mesh(mergeGeos(sheets),sheetMat);scene.add(roofSheets);RV.roofSheets=roofSheets;
 // A closed roller shutter on the back wall: its slats carry the red wash and give the wall scale.
 const shutter=[];for(let y=.12;y<5.4;y+=.085)shutter.push(new THREE.BoxGeometry(6.4,.07,.035).translate(0,y,-44.07));
 shutter.push(new THREE.BoxGeometry(.16,5.6,.14).translate(-3.3,2.8,-44.03),new THREE.BoxGeometry(.16,5.6,.14).translate(3.3,2.8,-44.03),new THREE.BoxGeometry(7,.62,.55).translate(0,5.85,-43.85));rvBatch(shutter,galv);
 // The booth tube: a red source with a metal housing and two hangers.
 rvBox(5.6,.16,.2,0,7.2,-36.75,dark);const tube=rvBox(5.4,.035,.07,0,7.11,-36.62,red);RV.signals.push(tube);
 rvBatch([new THREE.BoxGeometry(.012,2.7,.012).translate(-2.5,8.65,-36.75),new THREE.BoxGeometry(.012,2.7,.012).translate(2.5,8.65,-36.75)],edge);
 rvExterior();rvEstate();
};

// The street face: concrete piers and dado, galvalume trapezoidal cladding, painted steel doors.
function rvFacade(){const {concrete,galv,steel,dark,edge,black,glass,alu,red}=mats;
 const conc=[],cladding=[],trim=[],paint=[],gl=[];
 // Wall mass and dado (0-2.4 m), coping ledge, parapet band. Front face of the wall plane at z -7.75.
 conc.push(rvG(12,14,.75,-10,7,-8.125,2.4),rvG(12,14,.75,10,7,-8.125,2.4),rvG(8,4.64,.75,0,11.68,-8.125,2.4));
 conc.push(rvG(11.2,.14,.24,-10.6,2.47,-7.66,2.4),rvG(11.2,.14,.24,10.6,2.47,-7.66,2.4));
 conc.push(rvG(32.4,.55,.5,0,14.03,-7.72,2.4),rvG(32.4,.08,.62,0,14.33,-7.72,2.4));
 for(const x of [-15.7,-10.3,-5.0,5.0,10.3,15.7])conc.push(rvG(.62,13.75,.42,x,6.875,-7.6,2.4));
 // Trapezoidal galvalume: 250 mm pitch, 32 mm ribs, one merged sheet field.
 const panels=[[-15.39,-10.61,2.54,13.75],[-9.99,-5.31,2.54,13.75],[5.31,9.99,2.54,13.75],[10.61,15.39,2.54,13.75],[-4.69,4.69,9.36,13.75]];
 for(const [x0,x1,y0,y1] of panels)cladding.push(rvTrapezoid(x0,x1,y0,y1,-7.75));
 rvBatch(conc,concrete);const clad=rvBatch(cladding,galv);clad.castShadow=false;
 // Door frame, threshold, canopy (painted steel, primer at the edges).
 paint.push(new THREE.BoxGeometry(9.2,.32,1.7).translate(0,9.2,-7.4),new THREE.BoxGeometry(.34,9.04,1.7).translate(-4.4,4.52,-7.4),new THREE.BoxGeometry(.34,9.04,1.7).translate(4.4,4.52,-7.4));
 conc.length=0;conc.push(rvG(9.6,.25,2.3,0,.125,-6.9,2.4),rvG(10.2,.12,2.8,0,.06,-6.2,2.4));rvBatch(conc,concrete);
 paint.push(new THREE.BoxGeometry(10.6,.17,3.6).translate(0,9.55,-6.25),new THREE.BoxGeometry(10.6,.16,.1).translate(0,9.4,-4.48));
 for(const x of [-4.3,4.3]){const b=new THREE.BoxGeometry(.08,2.4,.08);b.rotateX(.72);b.translate(x,10.5,-6.8);paint.push(b);}
 for(let x=-5;x<=5.01;x+=.65)trim.push(new THREE.BoxGeometry(.025,.05,3.6).translate(x,9.66,-6.25));
 // The glow sign: an aluminium light box behind the supplied artwork, on four brackets.
 const box=[new THREE.BoxGeometry(10.62,1.74,.26).translate(0,11.4,-7.32)];for(const x of [-5.2,5.2])box.push(new THREE.BoxGeometry(.06,1.78,.05).translate(x,11.4,-7.15));for(const y of [10.55,12.25])box.push(new THREE.BoxGeometry(10.46,.05,.05).translate(0,y,-7.15));
 for(const x of [-4.6,-1.5,1.5,4.6])box.push(new THREE.BoxGeometry(.08,.08,.32).translate(x,11.4,-7.6));
 rvBatch(box,alu);
 // Sconces on the piers flanking the door: the left one lit, the right one dead.
 for(const x of [-5,5]){paint.push(new THREE.BoxGeometry(.24,.5,.22).translate(x,6.42,-7.28),new THREE.BoxGeometry(.32,.06,.3).translate(x,6.15,-7.25));for(const dx of [-.12,.12])trim.push(new THREE.BoxGeometry(.022,.34,.022).translate(x+dx,6.02,-7.13));}
 const lamp=new THREE.Mesh(new THREE.BoxGeometry(.26,.04,.24),new THREE.MeshBasicMaterial({color:rvShow(0xffd2a1,.9,1.5),toneMapped:true}));lamp.position.set(-5,6.11,-7.25);scene.add(lamp);RV.sconce=lamp;
 gl.push(new THREE.BoxGeometry(.26,.04,.24).translate(5,6.11,-7.25));
 // Service windows (dark glass, steel bars), downpipes, conduit and meter box.
 for(const x of [-13,13]){gl.push(new THREE.BoxGeometry(3.6,2,.08).translate(x,9.3,-7.7));for(const dx of [-1.8,-.6,.6,1.8])trim.push(new THREE.BoxGeometry(.05,2.04,.07).translate(x+dx,9.3,-7.63));for(const dy of [-1,0,1])trim.push(new THREE.BoxGeometry(3.66,.05,.07).translate(x,9.3+dy,-7.63));}
 const sills=[rvG(3.9,.1,.22,-13,8.25,-7.62,2.4),rvG(3.9,.1,.22,13,8.25,-7.62,2.4)];rvBatch(sills,concrete);
 for(const x of [-9.65,9.65]){paint.push(rvTubeGeo([[x,13.9,-7.45],[x,12.6,-7.45],[x,1,-7.45],[x,.25,-7.2]],.065));for(let y=2;y<13;y+=3)trim.push(new THREE.BoxGeometry(.2,.06,.14).translate(x,y,-7.5));}
 paint.push(rvTubeGeo([[-15.2,11.2,-7.55],[-12,11.2,-7.55],[-8.2,11.2,-7.55],[-8.2,4.1,-7.55]],.05),new THREE.BoxGeometry(.62,.95,.24).translate(-8.2,3.55,-7.62));
 // Service vent on the right, in the dark third.
 paint.push(new THREE.BoxGeometry(2.6,1.5,.45).translate(11.5,5.6,-7.5));for(let i=0;i<15;i++)trim.push(new THREE.BoxGeometry(2.4,.028,.13).translate(11.5,4.95+i*.085,-7.21));
 RV.facadePaint=rvBatch(paint,dark);rvBatch(trim,edge);rvBatch(gl,glass);
 // Door leaves: outward-opening, painted steel with primer wear; one merged hardware set per leaf.
 for(const side of [-1,1]){const hinge=new THREE.Group();hinge.position.set(side*4,0,-7.7);scene.add(hinge);
  const leafMat=new THREE.MeshStandardMaterial({map:rvDoorTex(side>0),roughness:.55,metalness:0});
  const leaf=new THREE.Mesh(RVBOX,leafMat);leaf.scale.set(3.96,8.65,.2);leaf.position.set(-side*1.99,4.595,0);leaf.castShadow=!LOW;leaf.receiveShadow=true;hinge.add(leaf);
  const hw=[];for(const y of [1.3,4.77,7.9]){hw.push(new THREE.BoxGeometry(3.8,.1,.06).translate(-side*2,y,.13));hw.push(new THREE.CylinderGeometry(.08,.08,.5,8).translate(0,y,.14));}
  for(const yy of [2.6,7])hw.push(new THREE.BoxGeometry(.4,.15,.1).translate(-side*3.8,yy,.15));
  hw.push(new THREE.BoxGeometry(.05,.8,.1).translate(-side*3.5,3.9,.18),new THREE.BoxGeometry(.06,.06,.12).translate(-side*3.5,3.55,.13),new THREE.BoxGeometry(.06,.06,.12).translate(-side*3.5,4.25,.13));
  for(let i=0;i<24;i++)hw.push(new THREE.BoxGeometry(.05,.05,.03).translate(-side*(i%2?3.82:.2),.7+Math.floor(i/2)*.68,.11));
  const hm=new THREE.Mesh(mergeGeos(hw),dark);hm.castShadow=!LOW;hm.receiveShadow=true;hinge.add(hm);
  RV.doors.push({hinge,side,leaf});}
 // The red seam between the leaves and the line of light under them.
 const seam=rvBox(.035,8.66,.06,0,4.6,-7.6,red);RV.seam=seam;const under=rvBox(7.9,.022,.05,0,.262,-7.59,red);RV.underDoor=under;
 // Wheatpaste house rules on the left dado, in the sodium and sconce light. Single-sided.
 [[['NO','PHOTOS'],1.32,1.72,-9.0,1.5,23],[['BE','PRESENT'],1.32,1.72,-7.68,1.42,24],[['LOOK','AFTER','EACH','OTHER'],1.36,1.86,-6.32,1.48,25]].forEach(([v,w,h,x,y,seed],i)=>{
  const p=rvPanel(v,w,h,x,y,-7.735+i*.004,{paper:true,seed,torn:true,w:LOW?192:256,h:Math.round((LOW?192:256)*h/w)});p.rotation.z=(i-1)*.012;RV.notices.push(p);});
}
// Trapezoidal sheet with real ribs (crest 40 mm, pan, 32 mm height), world-mapped UVs (u = x/4, v = y/14).
function rvTrapezoid(x0,x1,y0,y1,z){
 const pitch=.25,h=.032,crest=.04,web=.025,pos=[],nor=[],uv=[],idx=[];const pts=[];
 for(let x=x0;x<x1-1e-4;x+=pitch){const a=x,b=Math.min(x1,x+pitch);const c=(a+b)/2;pts.push([a,0],[c-crest/2-web,0],[c-crest/2,h],[c+crest/2,h],[c+crest/2+web,0]);}
 pts.push([x1,0]);
 for(let i=0;i<pts.length-1;i++){const [ax,ah]=pts[i],[bx,bh]=pts[i+1];const dx=bx-ax,dh=bh-ah,l=Math.hypot(dx,dh)||1,nx=-dh/l,nz=dx/l;const base=pos.length/3;
  for(const [px,ph,py] of [[ax,ah,y0],[bx,bh,y0],[bx,bh,y1],[ax,ah,y1]]){pos.push(px,py,z+ph);nor.push(nx,0,nz);uv.push(px/4,py/14);}
  idx.push(base,base+1,base+2,base,base+2,base+3);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);return g;
}
// The yard: sodium pole, neighbours, apron furniture, and the drip line under the canopy.
function rvExterior(){const {concrete,galv,steel,dark,edge,black,alu}=mats;
 const metal=[],dk=[];
 for(const k of ['sodium','road']){const L=RV_RIG[k],[px,,pz]=L.pole,[hx,hy,hz]=L.head,dir=Math.sign(hx-px);
  metal.push(new THREE.CylinderGeometry(.06,.1,hy+.15,10).translate(px,(hy+.15)/2,pz),new THREE.BoxGeometry(.4,.04,.4).translate(px,.02,pz));
  metal.push(rvTubeGeo([[px,hy-.4,pz],[px+dir*.2,hy+.05,pz],[px+dir*.8,hy+.12,pz],[hx-dir*.2,hy+.08,hz]],.04,4));
  dk.push(new THREE.BoxGeometry(.62,.14,.28).translate(hx,hy,hz),new THREE.BoxGeometry(.5,.05,.24).translate(hx,hy+.09,hz));
  const head=new THREE.Mesh(new THREE.BoxGeometry(.46,.03,.2),new THREE.MeshBasicMaterial({color:rvShow(L.color,.9,1.6)}));head.position.set(hx,hy-.08,hz);scene.add(head);RV[k+'Head']=head;}
 rvBatch(metal,alu);rvBatch(dk,dark);
 // Neighbouring sheds in the alleys: dark masses that sink into the skyglow.
 const nb=[rvG(7,9.5,28,23.5,4.75,-20,4),rvG(5,8,23,-23,4,-21,4)];rvBatch(nb,dark);
 const roofs=[new THREE.BoxGeometry(7.6,.12,28.6).rotateZ(-.18).translate(23.5,10.1,-20),new THREE.BoxGeometry(5.6,.12,23.6).rotateZ(.2).translate(-23,8.5,-21)];rvBatch(roofs,galv);
 // Apron: bollards, cast-iron channel grate, a cable coil; worn parking marks.
 for(const x of [-5.6,5.6]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.13,.15,1.1,12),steel);p.position.set(x,.55,-3.6);p.castShadow=!LOW;p.receiveShadow=true;scene.add(p);}
 const grate=[new THREE.BoxGeometry(12,.03,.42).translate(0,.012,-3.2)];for(let i=0;i<24;i++)grate.push(new THREE.BoxGeometry(.04,.02,.38).translate(-5.75+i*.5,.035,-3.2));rvBatch(grate,steel);
 const coil=[];for(let i=0;i<4;i++)coil.push(new THREE.TorusGeometry(.55+i*.027,.017,5,40).rotateX(Math.PI/2).translate(-6.6,.035+i*.02,-2.4));rvBatch(coil,black);
 const marking=new THREE.MeshStandardMaterial({color:rvLin(0x6a665e),roughness:.9});const marks=[];
 for(const side of [-1,1])for(let j=0;j<8;j++)if((j*7+side*3)%5)marks.push(new THREE.BoxGeometry(.1,.006,.62).translate(side*8.4,.012,2+j*.9));rvBatch(marks,marking);
 // Kerb and drain channel where the apron meets the road.
 const kp=new THREE.Shape();kp.moveTo(-.15,0);kp.lineTo(.15,0);kp.lineTo(.15,.14);kp.lineTo(.13,.16);kp.lineTo(-.13,.16);kp.lineTo(-.15,.14);kp.closePath();
 const kerb=[17.3,21.6].map(z=>rvIndexed(rvWorldUV(new THREE.ExtrudeGeometry(kp,{depth:40,bevelEnabled:false}).rotateY(Math.PI/2).translate(-20,0,z),2.4)));rvBatch(kerb,concrete);
}
// Across the road (z +22 to +60): compound wall, sheds, water tanks, sagging cables and the
// turbo ventilators, merged into one vertex-coloured mesh (ventilators spin in its shader).
function rvEstate(){
 const parts=[],add=(g,hex,spin)=>{parts.push({g,c:rvLin(hex),spin});};
 const wall=0x8b857a,plaster=0x76726a,roofC=0x7d817f,tank=0x111111,steelC=0x2a2b2c;
 // Compound wall with piers and coping; a steel gate.
 for(let x=-46;x<46;x+=3.2){add(new THREE.BoxGeometry(3.2,2.4,.23).translate(x+1.6,1.2,28.6),wall);add(new THREE.BoxGeometry(.38,2.7,.38).translate(x,1.35,28.6),wall);}
 add(new THREE.BoxGeometry(92,.1,.34).translate(0,2.45,28.6),0x9a9488);
 add(new THREE.BoxGeometry(4.2,2.1,.06).translate(-3.2,1.08,28.35),steelC);
 // Sheds: gable, flat RCC and saw-tooth roofs, 4-7 m.
 const shed=(x0,x1,z0,z1,eave,ridge,hex)=>{const w=x1-x0,d=z1-z0,cx=(x0+x1)/2,cz=(z0+z1)/2;add(new THREE.BoxGeometry(w,eave,d).translate(cx,eave/2,cz),hex);
  if(ridge>eave){const rise=ridge-eave,half=d/2,len=Math.hypot(half,rise),a=Math.atan2(rise,half);for(const s of [-1,1]){const r=new THREE.BoxGeometry(w+.6,.1,len+.4);r.rotateX(s*a);r.translate(cx,eave+rise/2,cz-s*half/2);add(r,roofC);}
   add(new THREE.BoxGeometry(w,rise,d).scale(1,1,.01).translate(cx,eave+rise/2,z0),hex);}};
 shed(-18,-4,33,47,4.6,6.4,plaster);shed(-2,8,31,49,5.6,7.0,0x6c6a64);shed(9,24,36,52,4.0,4.0,0x625f59);shed(26,42,36,58,5,5,0x67645e);shed(-10,6,53,62,5.4,7,0x706d66);shed(-32,-15,47,60,4.2,4.2,plaster);
 for(let x=26.5;x<42;x+=3.4){const t=new THREE.BoxGeometry(3.4,1.4,.1);t.rotateX(-.75);t.translate(x+1.7,5.6,44);add(t,roofC);}
 add(new THREE.BoxGeometry(4.6,2.2,4.6).translate(-12,5.7,40),plaster);add(new THREE.BoxGeometry(15.4,.5,.25).translate(16.5,4.25,36.1),0x5a5751);
 // Two black water tanks on steel stands (Sintex-style): one just under the sun, one on the annex.
 for(const [x,y,z] of [[11,4.0,44],[-12,6.8,40]]){for(const dx of [-.55,.55])for(const dz of [-.55,.55])add(new THREE.BoxGeometry(.06,1,.06).translate(x+dx,y+.5,z+dz),steelC);add(new THREE.BoxGeometry(1.4,.06,1.4).translate(x,y+1.02,z),steelC);
  add(new THREE.CylinderGeometry(.7,.7,1.5,16).translate(x,y+1.8,z),tank);add(new THREE.CylinderGeometry(.22,.22,.12,10).translate(x,y+2.6,z),tank);for(let k=0;k<3;k++)add(new THREE.CylinderGeometry(.715,.715,.05,16).translate(x,y+1.3+k*.45,z),0x1b1b1b);}
 // Three turbo ventilators on the ridge of the near shed.
 for(const x of [.6,3,5.4]){const y=7.0,z=40;add(new THREE.CylinderGeometry(.16,.16,.35,8).translate(x,y+.17,z),roofC);
  for(let k=0;k<14;k++){const a=k/14*TAU,v=new THREE.BoxGeometry(.04,.5,.12);v.rotateZ(.35);v.rotateY(a);v.translate(x+Math.cos(a)*.3,y+.62,z+Math.sin(a)*.3);add(v,0x9da19e,[x,z,1]);}
  add(new THREE.CylinderGeometry(.08,.34,.12,14).translate(x,y+.93,z),0x9da19e,[x,z,1]);add(new THREE.CylinderGeometry(.34,.3,.06,14).translate(x,y+.35,z),0x9da19e,[x,z,1]);}
 // Street faces: roller shutters, high louvres and eaves, so the silhouettes read as working sheds.
 for(const [x0,x1,z0,eave] of [[-18,-4,33,4.6],[-2,8,31,5.6],[9,24,36,4.0],[26,42,36,5]]){const w=x1-x0;add(new THREE.BoxGeometry(w+.8,.08,.9).translate((x0+x1)/2,eave+.02,z0-.3),0x3e3c38);
  for(let x=x0+1.2;x<x1-1.5;x+=Math.max(3.2,w/3))add(new THREE.BoxGeometry(2.4,2.6,.06).translate(x+1.2,1.3,z0-.04),0x4a4843);
  add(new THREE.BoxGeometry(w*.7,.45,.05).translate((x0+x1)/2,eave-.6,z0-.03),0x2c2b28);}
 // A neem behind the wall: trunk, two limbs and a clumped crown.
 add(new THREE.CylinderGeometry(.18,.3,3.6,7).translate(-14,1.8,31.6),0x2b241d);for(const s2 of [-1,1]){const l=new THREE.CylinderGeometry(.09,.14,2.6,6);l.rotateZ(s2*.6);l.translate(-14+s2*.8,4.2,31.6);add(l,0x2b241d);}
 const crown=mulberry32(5);for(let k=0;k<16;k++){const r=.7+crown()*.8,g=new THREE.IcosahedronGeometry(r,1);g.scale(1,.72,1);g.translate(-14+(crown()-.5)*5.6,4.9+crown()*2.4,31.6+(crown()-.5)*3.2);add(g,0x283120);}
 // Three sagging cables from the road pole: catenary segments as thin boxes.
 const top=[RV_RIG.road.pole[0],RV_RIG.road.head[1]+.35,RV_RIG.road.pole[2]];
 for(const [ex,ey,ez,sag] of [[-30,7.2,27.2,1.4],[40,7.6,26.8,1.6],[14,6.1,31.1,.5]]){const n=14;let prev=null;for(let i=0;i<=n;i++){const t=i/n,x=top[0]+(ex-top[0])*t,z=top[2]+(ez-top[2])*t,y=top[1]+(ey-top[1])*t-sag*4*t*(1-t),p=new THREE.Vector3(x,y,z);
  if(prev){const mid=prev.clone().add(p).multiplyScalar(.5),len=prev.distanceTo(p),seg=new THREE.CylinderGeometry(.03,.03,len,4);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),p.clone().sub(prev).normalize());seg.applyQuaternion(q);seg.translate(mid.x,mid.y,mid.z);add(seg,0x0c0c0c);}prev=p;}}
 add(new THREE.BoxGeometry(160,.02,8).translate(0,.004,25.6),0x55524c);
 const mesh=new THREE.Mesh(rvMergeColoured(parts),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,metalness:0}));
 mesh.material.defines={RV_SPIN:''};mesh.castShadow=!LOW;mesh.receiveShadow=true;mesh.frustumCulled=false;scene.add(mesh);RV.estate=mesh;
}
function rvMergeColoured(parts){let vN=0,iN=0;const list=parts.map(p=>{const g=p.g.index?p.g:p.g;if(!g.index){const idx=[];for(let i=0;i<g.attributes.position.count;i++)idx.push(i);g.setIndex(idx);}vN+=g.attributes.position.count;iN+=g.index.count;return p;});
 const pos=new Float32Array(vN*3),nor=new Float32Array(vN*3),uv=new Float32Array(vN*2),col=new Float32Array(vN*3),spin=new Float32Array(vN*3),idx=vN>65535?new Uint32Array(iN):new Uint16Array(iN);let vo=0,io=0;
 for(const {g,c,spin:s} of list){const n=g.attributes.position.count;pos.set(g.attributes.position.array,vo*3);nor.set(g.attributes.normal.array,vo*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,vo*2);
  for(let i=0;i<n;i++){col[(vo+i)*3]=c.r;col[(vo+i)*3+1]=c.g;col[(vo+i)*3+2]=c.b;if(s){spin[(vo+i)*3]=s[0];spin[(vo+i)*3+1]=s[1];spin[(vo+i)*3+2]=s[2];}}
  const gi=g.index.array;for(let i=0;i<gi.length;i++)idx[io+i]=gi[i]+vo;io+=gi.length;vo+=n;g.dispose();}
 const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(pos,3));out.setAttribute('normal',new THREE.BufferAttribute(nor,3));out.setAttribute('uv',new THREE.BufferAttribute(uv,2));out.setAttribute('color',new THREE.BufferAttribute(col,3));out.setAttribute('rvSpin',new THREE.BufferAttribute(spin,3));out.setIndex(new THREE.BufferAttribute(idx,1));out.computeBoundingSphere();return out;}
function rvLogo(){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{const c=cvs(1024,148),ctx=c.getContext('2d');ctx.drawImage(img,48,426,936,148,0,0,1024,148);const texture=tx(c);texture.encoding=THREE.sRGBEncoding;const board=new THREE.Mesh(new THREE.PlaneGeometry(10.25,1.48),new THREE.MeshBasicMaterial({map:texture,toneMapped:true}));board.position.set(0,11.4,-7.16);scene.add(board);RV.logo=board;resolve();};img.onerror=()=>reject(new Error('Original RAVERS logo failed to load'));img.src='/assets/ravers-original-logo.png';});}
function rvTravel(p){const i=Math.floor(p);return i+smooth(...RV_CONFIG.travel,p-i);}

/* ------------------------------------------------------------ the sound system
   Black tolex cabinets with aluminium edges; 16 drivers as three instanced meshes
   (cone, dust cap, surround). Cone excursion is a shader uniform (uConeKick). */
function rvSpeakers(){const {steel,dark,edge,black,alu}=mats;
 const gear=new THREE.MeshStandardMaterial({color:rvLin(0x0f0f0f),roughness:.8,metalness:0});mats.gear=gear;
 const frame=[],bolts=[],lip=[];
 for(const side of [-1,1])for(let row=0;row<4;row++)for(let col=0;col<2;col++){const x=side*(3.4+col*1.68),y=.85+row*1.72,z=-35.8,F=z+.6;rvBox(1.58,1.6,1.06,x,y,z-.07,gear);
  lip.push(new THREE.BoxGeometry(1.58,.08,.14).translate(x,y+.76,F-.07),new THREE.BoxGeometry(1.58,.08,.14).translate(x,y-.76,F-.07),new THREE.BoxGeometry(.08,1.44,.14).translate(x-.75,y,F-.07),new THREE.BoxGeometry(.08,1.44,.14).translate(x+.75,y,F-.07));
  for(const dx of [-.775,.775])frame.push(new THREE.BoxGeometry(.03,1.6,.03).translate(x+dx,y,z+.6));for(const dy of [-.785,.785])frame.push(new THREE.BoxGeometry(1.58,.03,.03).translate(x,y+dy,z+.6));
  for(const dx of [-.66,.66])for(const dy of [-.65,.65])bolts.push(new THREE.BoxGeometry(.036,.036,.02).translate(x+dx,y+dy,z+.61));
  RV.cones.push({x,y,z:z+.6});}
 rvBatch(frame,alu);rvBatch(bolts,steel);rvBatch(lip,gear);
 const coneGeo=new THREE.ConeGeometry(.52,.12,24,1,true).rotateX(-Math.PI/2).translate(0,0,-.06),capGeo=new THREE.SphereGeometry(.15,14,8,0,TAU,0,Math.PI/2).rotateX(Math.PI/2).scale(1,1,.4).translate(0,0,-.085),ringGeo=new THREE.TorusGeometry(.53,.03,6,28);
 const coneMat=new THREE.MeshStandardMaterial({color:rvLin(0x1a1a1a),roughness:.92,side:THREE.DoubleSide});coneMat.defines={RV_KICK:''};
 const capMat=new THREE.MeshStandardMaterial({color:rvLin(0x151515),roughness:.32});capMat.defines={RV_KICK:''};
 const ringMat=new THREE.MeshStandardMaterial({color:rvLin(0x0c0c0c),roughness:.75});
 const o=new THREE.Object3D();RV.drivers={};
 for(const [k,g,m] of [['cone',coneGeo,coneMat],['cap',capGeo,capMat],['ring',ringGeo,ringMat]]){const mesh=new THREE.InstancedMesh(g,m,RV.cones.length);RV.cones.forEach((c,i)=>{o.position.set(c.x,c.y,c.z-.02);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);});mesh.instanceMatrix.needsUpdate=true;mesh.frustumCulled=false;mesh.receiveShadow=true;scene.add(mesh);RV.drivers[k]=mesh;}
 // Flight-case booth: laminate shell, aluminium extrusions, ball corners, butterfly latches.
 const bx=0,by=.5,bz=-31.7,W=2.4,H=1,D=.85;rvBox(W,H,D,bx,by,bz,gear);rvBox(W+.08,.04,D+.06,bx,1.02,bz,gear);
 const ext=[];for(const sy of [-1,1])for(const sz of [-1,1])ext.push(new THREE.BoxGeometry(W+.02,.035,.035).translate(bx,by+sy*H/2,bz+sz*D/2));for(const sx of [-1,1])for(const sz of [-1,1])ext.push(new THREE.BoxGeometry(.035,H,.035).translate(bx+sx*W/2,by,bz+sz*D/2));for(const sx of [-1,1])for(const sy of [-1,1])ext.push(new THREE.BoxGeometry(.035,.035,D).translate(bx+sx*W/2,by+sy*H/2,bz));
 for(const sx of [-1,1])for(const sy of [-1,1])for(const sz of [-1,1])ext.push(new THREE.SphereGeometry(.035,8,6).translate(bx+sx*W/2,by+sy*H/2,bz+sz*D/2));
 for(const lx of [-.8,.8]){ext.push(new THREE.BoxGeometry(.11,.07,.025).translate(lx,.78,bz+D/2+.012));ext.push(new THREE.BoxGeometry(.2,.04,.04).translate(lx,.3,bz+D/2+.02));}
 rvBatch(ext,alu);
 // Two turntables (453 x 353 x 162 mm, 332 mm platter) and a two-channel mixer (320 x 388 x 108 mm).
 const tt=[],ttMetal=[],felt=[];for(const sx of [-1,1]){const x=sx*.66,y=1.04,z=bz-.02;tt.push(new THREE.BoxGeometry(.453,.12,.353).translate(x,y+.06,z));
  ttMetal.push(new THREE.CylinderGeometry(.166,.166,.03,40).translate(x-.04,y+.135,z));felt.push(new THREE.CylinderGeometry(.158,.158,.006,40).translate(x-.04,y+.153,z));
  ttMetal.push(new THREE.CylinderGeometry(.03,.03,.05,10).translate(x+.15,y+.15,z-.12),new THREE.BoxGeometry(.012,.012,.23).rotateY(.32).translate(x+.12,y+.17,z-.02),new THREE.BoxGeometry(.06,.012,.012).translate(x+.17,y+.13,z+.12));}
 tt.push(new THREE.BoxGeometry(.32,.108,.388).translate(0,1.094,bz-.02));for(let i=0;i<12;i++)ttMetal.push(new THREE.CylinderGeometry(.012,.012,.02,8).translate(-.09+(i%4)*.06,1.158,bz-.15+Math.floor(i/4)*.06));
 for(let i=0;i<3;i++)ttMetal.push(new THREE.BoxGeometry(.014,.016,.03).translate(-.06+i*.06,1.156,bz+.1));
 rvBatch(tt,gear);rvBatch(ttMetal,alu);rvBatch(felt,black);
 // Gooseneck booth lamp at the back right corner, and the patch cables to the stacks.
 rvBatch([rvTubeGeo([[1.05,1.04,bz-.36],[1.06,1.25,bz-.33],[.98,1.46,bz-.22],[.88,1.47,bz-.12]],.012,6),new THREE.CylinderGeometry(.05,.035,.08,10).translate(.86,1.45,bz-.1)],black);
 const bulb=new THREE.Mesh(new THREE.CircleGeometry(.03,10).rotateX(Math.PI/2),new THREE.MeshBasicMaterial({color:rvShow(0xffcf9a,1,1.2)}));bulb.position.set(.86,1.405,bz-.1);scene.add(bulb);RV.boothBulb=bulb;
 const cables=[];for(let i=0;i<5;i++)cables.push(rvTubeGeo([[-1+i*.45,.9,bz-.43],[-1+i*.45,.2,-33.1],[-2+i*.7,.03,-34],[3+i*.2,.03,-35.1]],.017,6));rvBatch(cables,black);
 // The 140: 0.45 m white spray stencil on the case front.
 const st=new THREE.Mesh(new THREE.PlaneGeometry(.9,.45),new THREE.MeshStandardMaterial({map:rvStencil(),transparent:true,depthWrite:false,roughness:.85,polygonOffset:true,polygonOffsetFactor:-2}));st.position.set(0,.52,bz+D/2+.004);scene.add(st);RV.stencil=st;
}
function rvObjects(){const {concrete,steel,dark,edge,black}=mats;
 // Mezzanine on the right: grated lip, rail uprights, small service door.
 rvBox(3.2,.22,13,9,5.5,-26,steel);const bal=[];for(let z=-32;z<-19;z+=.7)bal.push(new THREE.BoxGeometry(.04,1.15,.04).translate(7.45,6.15,z));bal.push(new THREE.BoxGeometry(.055,.055,13).translate(7.45,6.72,-25.8));rvBatch(bal,steel);rvBox(.12,3,1.4,10.75,7.1,-29,dark);
 // WAY OUT: a maintained exit sign above the door, facing into the hall.
 const exit=rvPanel(['WAY OUT'],1.5,.4,0,9.82,-8.6,{paper:false,w:256,h:68,bg:'#0d0d0c',ink:'#ebe6da',pad:.12});exit.rotation.y=Math.PI;
 exit.material.dispose();exit.material=new THREE.MeshBasicMaterial({map:exit.material.map,color:rvShow(0xd9d4c7,1,1.0)});RV.exitSign=exit;
 rvBox(1.6,.48,.1,0,9.82,-8.53,mats.gear);
}
function rvAtmosphere(){WORLD.haze=[];}
// Keep the source card camera and compositor, with views into this same venue.
buildCards=function(){const defs=[{p:[-2,4,-14],t:[-6,5,-22],fov:43},{p:[3,3,-25],t:[0,3.8,-36],fov:47},{p:[1,3,-18],t:[7,3,-28],fov:44}];$$('[data-view]').forEach(el=>{if(CARDS.some(card=>card.el===el.querySelector('[data-frame]')))return;const d=defs[+el.dataset.view],c=new THREE.PerspectiveCamera(d.fov,4/5,.3,150);c.position.set(...d.p);c.lookAt(...d.t);c.layers.set(0);c.userData={home:c.position.clone(),look:new THREE.Vector3(...d.t),push:0,want:0};CARDS.push({cam:c,el:el.querySelector('[data-frame]'),rect:null});el.addEventListener('pointerenter',()=>c.userData.want=1);el.addEventListener('pointerleave',()=>c.userData.want=0);el.addEventListener('focus',()=>c.userData.want=1);el.addEventListener('blur',()=>c.userData.want=0);});};
layoutWord=function(){if(WORD.group)WORD.group.visible=false;WORD.rise=0;};
placeMoon=function(){};
fitAspect=function(p,t,fov){const a=aspectFix();if(a>0){_d.subVectors(p,t).normalize();p.addScaledVector(_d,a*(RIG.smooth<.8?7:2));return fov*(1+a*.18);}return fov;};

/* ------------------------------------------------------------ base state
   Pure function of RIG.smooth and WORLD.uT. No beat here: base intensities are
   steady and rewritten every frame, so later multiplicative wrappers never compound. */
const RV_SUN=new THREE.Vector3(),RV_KEYDIR=new THREE.Vector3(),RV_TMP=new THREE.Color(),RV_TMP2=new THREE.Color();
function rvSunDir(p,out){const R=RV_RIG.sun,el=THREE.MathUtils.degToRad(lerp(R.elevation[0],R.elevation[1],smooth(3.9,5,p))),az=THREE.MathUtils.degToRad(R.azimuth);return out.set(Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)).normalize();}
updateWorld=function(dt){WORLD.uT.value=clock;const p=RIG.smooth,C=RV_CONFIG,R=RV_RIG,E=RV.environment,U=E.uniforms,B=E.base;
 const openL=smooth(C.doorOpen[0],C.doorOpen[1],p),openR=smooth(C.doorOpen[0]+.03,C.doorOpen[1],p),open=openL;
 const dawn=smooth(...C.dawn,p),red=1-smooth(...C.redOut,p),sodium=1-smooth(...C.sodiumOff,p),keySun=smooth(C.dawn[0],C.dawn[0]+.55,p);
 RV.doors.forEach(d=>d.hinge.rotation.y=d.side*(d.side<0?openL:openR)*1.45);
 const shut=1-smooth(0,.035,open);RV.seam.visible=RV.underDoor.visible=shut>.001;RV.signals.forEach(m=>m.visible=red>.02);
 // Steady base values (the choreographer multiplies uSeam, uTube, uBack and writes uConeKick).
 U.uDawn.value=dawn;U.uKeySun.value=keySun;U.uRed.value=red;U.uSodium.value=sodium;
 U.uSeam.value=B.seam*shut;U.uTube.value=B.tube*red;U.uBack.value=B.back*red;U.uLamp.value=B.lamp*red;U.uStrip.value=B.strip*red;
 U.uSconce.value=B.sconce*sodium;U.uSign.value=B.sign;U.uConeKick.value=0;
 U.uRoad.value=B.road*(1-smooth(C.sodiumOff[0]+.08,C.sodiumOff[1],p));
 U.uSodRes.value=B.sodium*sodium*keySun;U.uRoofGlow.value=smooth(C.dawn[0],C.dawn[0]+.4,p)*.55+smooth(4,5,p)*.45;
 rvSunDir(p,RV_SUN);U.uSun.value.copy(RV_SUN);
 // The key: yard sodium (point-like pool, see environment.js) rotating to the sun.
 const key=WORLD.key,sunCol=RV_TMP.copy(E.col.sun0).lerp(E.col.sun1,smooth(4.35,5,p));
 key.color.copy(E.col.sodium).lerp(sunCol,keySun);key.intensity=lerp(B.sodium*sodium,lerp(R.sun.intensity[0],R.sun.intensity[1],smooth(4.35,5,p)),keySun);
 RV_KEYDIR.fromArray(R.sodium.head).sub(key.target.position).normalize().lerp(RV_SUN,keySun).normalize();
 key.target.position.set(lerp(-4,4,keySun),lerp(1.5,2,keySun),lerp(-7.6,20,keySun));key.position.copy(key.target.position).addScaledVector(RV_KEYDIR,lerp(48,70,keySun));
 if(WANT_SHADOW){const sc=key.shadow.camera,w=lerp(24,34,keySun),h=lerp(24,14,keySun),f=lerp(110,150,keySun);if(sc.right!==w||sc.top!==h){sc.left=-w;sc.right=w;sc.top=h;sc.bottom=-h;sc.far=f;sc.updateProjectionMatrix();}}
 RV.hemi.intensity=lerp(R.hemi.night,R.hemi.dawn,dawn);RV.hemi.color.copy(E.skyNight).lerp(E.skyDawn,dawn);RV.hemi.groundColor.copy(E.groundNight).lerp(E.groundDawn,dawn);
 // Emissive practicals follow their circuits; the glow sign stays lit to the end.
 RV.sconce.material.color.copy(E.sconceOn).multiplyScalar(sodium);
 RV.sodiumHead.material.color.copy(E.sodiumOn).multiplyScalar(sodium);RV.roadHead.material.color.copy(E.sodiumOn).multiplyScalar(Math.max(U.uRoad.value/B.road,.12*(1-smooth(4.5,4.9,p))));
 RV.boothBulb.material.color.copy(E.lampOn).multiplyScalar(red);
 RV.roofSheets.material.color.copy(E.roofNight).lerp(E.roofDawn,U.uRoofGlow.value);
 // Fog: exterior night, hall, then dawn haze.
 const inside=smooth(1.15,1.75,p)*(1-smooth(3.7,4.3,p));scene.fog.color.copy(E.fogNight).lerp(E.fogHall,inside).lerp(E.fogDawn,dawn);
 scene.fog.density=lerp(lerp(.010,.014,inside),lerp(.006,.004,smooth(4.35,5,p)),dawn);
 if(WORD.group){const near=smooth(.05,.88,p);WORD.glyphs.forEach((g,i)=>{const e=easeOut(sat((WORD.reveal-i*.04)/.62));g.position.y=g.userData.baseY-(1-e)*WORD.ink.asc;g.material.opacity=e*(1-near);g.visible=g.material.opacity>.004;});}
 CARDS.forEach(Cd=>{const u=Cd.cam.userData;u.push=damp(u.push,u.want,3.4,dt);});
 if(WORLD.key&&WANT_SHADOW&&(open!==RV.lastOpen||RV.lastKey.distanceToSquared(RV_KEYDIR)>1e-5)){WORLD.key.shadow.needsUpdate=true;RV.lastOpen=open;RV.lastKey.copy(RV_KEYDIR);}
};
// Keep one animation clock. Pointer motion and ambient motion stop in reduced mode.
frame=function(now){if(!running||RV.disposed)return;const raw=(now-tPrev)/1000||0,dt=Math.min(raw,.05);tPrev=now;if(!RV.paused)clock=RV.audio?.active?RV.audio.time:clock+dt;fadeIn=INTRO.t0?sat((now-INTRO.t0)/700):1;
 if(!PERF.locked&&clock>3){PERF.acc+=raw;PERF.n++;if(PERF.n>=90){const avg=PERF.acc/PERF.n;PERF.acc=PERF.n=0;if(avg>.027&&PERF.scale>.6){PERF.scale=Math.max(.6,PERF.scale*.85);resize();}}}
 RIG.prog=rvTravel(progressFor(scrollY));RIG.smooth=REDUCE?Math.round(RIG.prog):damp(RIG.smooth,RIG.prog,RV_CONFIG.damping,dt);RIG.mx=REDUCE?0:damp(RIG.mx,RIG.tmx,2.6,dt);RIG.my=REDUCE?0:damp(RIG.my,RIG.tmy,2.6,dt);
 if(INTRO.t0){const elapsed=(now-INTRO.t0)/1000;RIG.intro=REDUCE?1:sat(elapsed/2.4);WORD.reveal=REDUCE?1.2:Math.min(1.2,elapsed/1.5);}applyCamera();updateWorld(dt);
 if(REDUCE){const distance=Math.abs((RIG.prog%1)-.5);fadeIn*=smooth(0,.09,distance);}
 const moved=Math.abs(RIG.prog-(RV.lastProgress??-1))>.0001||Math.abs(RIG.smooth-RIG.prog)>.0001;if(!RV.paused||moved||RV.dirty||fadeIn<1){render();RV.dirty=false;RV.lastProgress=RIG.prog;}queue();};
wireCursor=function(){if(COARSE||REDUCE)return;addEventListener('pointermove',e=>{RIG.tmx=e.clientX/vpW()*2-1;RIG.tmy=1-e.clientY/vpH()*2;},{passive:true});};
const oldResize=resize;resize=function(){oldResize();RV.dirty=true;};
function rvWire(){const pause=$('#rv-pause');pause.textContent=RV.paused?'RESUME MOTION':'PAUSE MOTION';pause.setAttribute('aria-pressed',String(RV.paused));document.body.classList.toggle('rv-paused',RV.paused);pause.onclick=()=>{RV.paused=!RV.paused;document.body.classList.toggle('rv-paused',RV.paused);pause.textContent=RV.paused?'RESUME MOTION':'PAUSE MOTION';pause.setAttribute('aria-pressed',String(RV.paused));RV.dirty=true;};
 const btn=$('#rv-sound');btn.onclick=async()=>{try{if(!RV.audio){const m=await import('/sound.mjs');RV.audio=m.createSound();}const on=await RV.audio.toggle();btn.innerHTML='<span class="sound-icon">▂▅▃▇▂</span> SOUND '+(on?'ON':'OFF')+' <span>↗</span>';btn.setAttribute('aria-pressed',String(on));}catch(e){btn.textContent='SOUND UNAVAILABLE';}};
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&RV.audio){RV.audio.pause();btn.setAttribute('aria-pressed','false');btn.innerHTML='<span class="sound-icon">▂▅▃▇▂</span> SOUND OFF <span>↗</span>';}});
 const dialog=$('#culture-dialog'),data=[['THE CLOTHES','What you wear is part of how you belong. RAVERS brings the attitude of the night into the everyday.'],['THE NIGHTS','Techno is the meeting point. Follow the sound, make the journey, and give yourself to the room.'],['THE PEOPLE','Same sound. New company. A shared night is the beginning of a connection that lasts beyond the doors.']];$$('[data-detail]').forEach(b=>b.onclick=()=>{const i=+b.dataset.detail;$('#dialog-title').textContent=data[i][0];$('#dialog-index').textContent='RAVERS.IN / 0'+(i+1);$('#dialog-copy').textContent=data[i][1];dialog.showModal();});$('#dialog-close').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();running=false;RV.contextLost=true;document.documentElement.classList.add('no-webgl');document.body.classList.add('no-webgl');$('#rv-quality').textContent='GRAPHICS PAUSED';});canvas.addEventListener('webglcontextrestored',()=>{location.reload();});
 window.addEventListener('pagehide',e=>{running=false;RV.audio?.pause();if(e.persisted)return;RV.disposed=true;const resources=new Set();scene?.traverse(o=>{if(o.geometry)resources.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m){Object.values(m).forEach(v=>{if(v?.isTexture)resources.add(v)});resources.add(m);}});for(const v of resources)v.dispose();POST.levels.forEach(l=>{l.a.dispose();l.b.dispose();});for(const v of Object.values(POST))if(v?.dispose)v.dispose();CARDS.forEach(c=>c.rt?.dispose());renderer?.dispose();});window.addEventListener('pageshow',e=>{if(e.persisted&&!RV.disposed){running=true;tPrev=performance.now();RV.dirty=true;queue();}});
 addEventListener('keydown',e=>{if(e.key==='Tab'&&nav.classList.contains('menu-open')){const items=[...nav.querySelectorAll('a,button')],first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{REDUCE=e.matches;RV.paused=REDUCE;document.body.classList.toggle('rv-paused',RV.paused);pause.textContent=RV.paused?'RESUME MOTION':'PAUSE MOTION';pause.setAttribute('aria-pressed',String(RV.paused));RV.dirty=true;});
 window.addEventListener('ravers:ui-ready',()=>{buildCards();measure();RV.dirty=true;});window.addEventListener('ravers:ui-change',()=>{CARDS.forEach(c=>c.dirty=true);RV.dirty=true;});const ui=document.getElementById('rv-wayfinder');if(ui&&typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(()=>{RV.dirty=true;measure();});observer.observe(ui);window.addEventListener('pagehide',e=>{if(!e.persisted)observer.disconnect();});}window.__raversConfig=RV_CONFIG;
}
