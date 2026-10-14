/* RAVERS derivative: authored Kage material helpers, glyph renderer,
   Catmull-Rom rig, live-view compositor and HDR post pipeline are retained.
   The venue geometry and editorial composition below are original. */
const RV={paused:REDUCE, doors:[], cones:[], banners:[], signals:[], audio:null, disposed:false};
const RV_CONFIG={tempo:140,doorOpen:[.35,1.2],dawn:[3.55,4.35],travel:[.12,.86],damping:6.2,camera:[
 {p:[6.8,2.4,18],t:[0,5.4,-8],fov:47},{p:[0,2.3,-1.5],t:[0,3.7,-24],fov:48},
 {p:[0,3.5,-16],t:[0,4,-32],fov:54},{p:[5.5,3.2,-24],t:[-1.5,4,-36],fov:52},
 {p:[-1,4,-28],t:[0,5,2],fov:52},{p:[-2,3,-20],t:[0,5,2],fov:54}]};
CAM.splice(0,CAM.length,...RV_CONFIG.camera);
const RVBOX=new THREE.BoxGeometry(1,1,1), RVBOLT=new THREE.CylinderGeometry(.037,.037,.026,6);
let mats;
function rvBox(w,h,d,x,y,z,mat,parent=scene){const m=new THREE.Mesh(RVBOX,mat);m.scale.set(w,h,d);m.position.set(x,y,z);m.castShadow=!LOW;m.receiveShadow=true;parent.add(m);return m;}
function rvTube(points,r,mat,parent=scene){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const m=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(8,points.length*8),r,6,false),mat);parent.add(m);return m;}
function rvBatch(parts,mat,parent=scene){const g=mergeGeos(parts),m=new THREE.Mesh(g,mat);m.castShadow=!LOW;m.receiveShadow=true;parent.add(m);return m;}
function rvSteel(){const c=cvs(512,512),x=c.getContext('2d'),r=mulberry32(561);x.fillStyle='#383732';x.fillRect(0,0,512,512);for(let i=0;i<2400;i++){const v=28+r()*45;x.strokeStyle=`rgba(${v},${v},${v},${.08+r()*.12})`;x.lineWidth=.4+r()*.8;const xx=r()*512,yy=r()*512;x.beginPath();x.moveTo(xx,yy);x.lineTo(xx+(r()-.5)*3,yy+r()*60);x.stroke();}for(let i=0;i<28;i++){x.strokeStyle='rgba(165,161,145,.12)';x.beginPath();const xx=r()*512,yy=r()*512;x.moveTo(xx,yy);x.lineTo(xx+3+r()*20,yy-2-r()*5);x.stroke();}const h=fbmCanvas(512,512,85,4,48,.4);return {map:c,normal:normalFromHeight(h,.5),rough:h};}
function rvPrint(lines,{paper=false,small='RAVERS.IN / AFTER HOURS',seed=4}={}){const c=cvs(1024,1024),x=c.getContext('2d'),rnd=mulberry32(seed);x.fillStyle=paper?'#bab4a5':'#181917';x.fillRect(0,0,1024,1024);x.fillStyle=paper?'#151612':'#d5d0c3';x.font='26px Archivo';x.fillText('R / INDEPENDENT TECHNO CULTURE',60,70);x.fillRect(60,105,904,2);lines.forEach((line,i)=>{x.font=Math.min(190,900/(line.length*.58))+'px Anton';x.fillText(line,54,340+i*175);});x.font='24px Archivo';x.fillText(small,60,920);x.fillRect(60,855,904,1);x.fillStyle=paper?'rgba(28,28,24,.13)':'rgba(200,192,175,.11)';for(let i=0;i<1300;i++){x.fillRect(rnd()*1024,rnd()*1024,.5+rnd()*5,.5+rnd()*2);}const t=tx(c);return t;}
function rvSign(lines,w,h,x,y,z,options={},parent=scene){const mat=new THREE.MeshStandardMaterial({map:rvPrint(lines,options),roughness:.96,side:THREE.DoubleSide});const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);m.position.set(x,y,z);parent.add(m);return m;}
buildLights=function(){const hemi=new THREE.HemisphereLight(0xe8e3d8,0x131310,.42);scene.add(hemi);RV.hemi=hemi;const key=new THREE.DirectionalLight(0xe8e3d8,1.8);key.position.set(-8,16,14);key.target.position.set(0,3,-14);scene.add(key.target);key.castShadow=WANT_SHADOW;if(WANT_SHADOW){key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-20,right:20,top:24,bottom:-12,near:1,far:90});key.shadow.bias=-.0006;key.shadow.normalBias=.025;}scene.add(key);WORLD.key=key;const l=new THREE.PointLight(0xe8232a,5.8,24,1.3);l.position.set(0,4,-10);scene.add(l);RV.seamLight=l;const back=new THREE.PointLight(0xe8232a,4.8,30,1.25);back.position.set(0,6,-34);scene.add(back);RV.backLight=back;const fill=new THREE.PointLight(0xe8e3d8,1.3,22,1.1);fill.position.set(-5,7,-20);scene.add(fill);RV.fill=fill;const dawn=new THREE.DirectionalLight(0xe8e3d8,0);dawn.position.set(1,9,20);dawn.target.position.set(-2,1,-30);scene.add(dawn,dawn.target);RV.dawn=dawn;};
buildShell=function(){
 const concrete=surface(texWall(),[1,1],{color:0xd0c5b2,normal:1.3,roughness:.94});
 const steel=surface(rvSteel(),[1,1],{color:0xc6c4bd,normal:.38,metalness:.68,roughness:.65});
 const dark=new THREE.MeshStandardMaterial({color:0x171815,roughness:.8,metalness:.35});
 const edge=new THREE.MeshStandardMaterial({color:0x737267,roughness:.46,metalness:.72});
 const black=new THREE.MeshStandardMaterial({color:0x080907,roughness:.94});
 const red=new THREE.MeshBasicMaterial({color:hdr(2.5,.022,.034),toneMapped:false});
 mats={concrete,steel,dark,edge,black,red};scene.fog.color.set(0x10100e);scene.fog.density=.012;scene.background.set(0x090909);
 const fT=texFloor();const fm=surface(fT,[8,8],{color:0xb1aaa0,normal:.45,roughness:.70,metalness:.11});const floor=new THREE.Mesh(new THREE.PlaneGeometry(130,130),fm);floor.rotation.x=-Math.PI/2;floor.position.set(0,-.025,-15);floor.receiveShadow=true;scene.add(floor);WORLD.floor=floor;
 // Front wall: recessed loading dock with cast-concrete piers and corrugated cladding.
 rvBox(12,14,1,-10,7,-8,concrete);rvBox(12,14,1,10,7,-8,concrete);rvBox(8,5,1,0,11.5,-8,concrete);
 const ribs=[];for(let i=0;i<96;i++){const x=-16+i/3;if(Math.abs(x)<4.1)continue;ribs.push(new THREE.BoxGeometry(.035,12,.12).translate(x,7,-7.43));}rvBatch(ribs,steel);
 rvBox(9.2,.32,1.7,0,9.2,-7.4,steel);rvBox(.34,9.3,1.7,-4.4,4.65,-7.4,steel);rvBox(.34,9.3,1.7,4.4,4.65,-7.4,steel);
 rvBox(9.6,.25,2.3,0,.125,-6.9,concrete);rvBox(10.2,.12,2.8,0,.06,-6.2,concrete);
 for(const side of [-1,1]){const hinge=new THREE.Group();hinge.position.set(side*4,0,-7.7);scene.add(hinge);rvBox(3.96,8.65,.20,-side*1.99,4.52,0,steel,hinge);for(const y of [1.05,4.5,8]){rvBox(3.8,.10,.11,-side*2,y,.15,edge,hinge);const pin=new THREE.Mesh(new THREE.CylinderGeometry(.095,.095,.55,12),edge);pin.position.set(0,y,.15);hinge.add(pin);}for(const yy of [2.4,6.8])rvBox(.45,.17,.13,-side*3.8,yy,.2,edge,hinge);rvBox(.06,.9,.15,-side*3.5,3.7,.24,edge,hinge);const sign=rvSign([side<0?'R / 01':'AFTER','HOURS'],1.4,1.4,-side*1.9,5.7,.13,{seed:side+4},hinge);RV.doors.push({hinge,side});
 const bolts=new THREE.InstancedMesh(RVBOLT,edge,36);const obj=new THREE.Object3D();for(let i=0;i<36;i++){obj.position.set(-side*(i%2?3.8:.18),.5+Math.floor(i/2)*.47,.14);obj.rotation.x=Math.PI/2;obj.updateMatrix();bolts.setMatrixAt(i,obj.matrix);}hinge.add(bolts);}
 const seam=rvBox(.035,8.7,.08,0,4.5,-7.52,red);RV.seam=seam;

 // Above the portal, a covered cable tray and two electrical boxes.
 rvTube([[-11,10,-7.2],[-7,10,-7.2],[-6,8,-7.2],[-6,3,-7.2]],.055,dark);rvTube([[8,12,-7.1],[8,4,-7.1],[8.6,3,-7.1]],.045,edge);
 rvBox(.7,1.1,.28,-6,3.4,-7.15,steel);rvSign(['POWER'],.48,.7,-6,3.4,-6.99,{small:'ISOLATE BEFORE SERVICE'});
 // Layered wheatpaste notices with offset corners and tape. Venue details, no fictional events.
 [['NO','PHOTOS'],['BE','PRESENT'],['LOOK','AFTER','EACH OTHER']].forEach((v,i)=>{const p=rvSign(v,.95,1.38,6+i*.8,2.7+i*.13,-7.4+i*.015,{paper:true,seed:23+i});p.rotation.z=(i-1)*.06;rvBox(.24,.08,.015,6+i*.8,3.34+i*.13,-7.34+i*.015,edge);});
 // Interior structure: I-beam uprights, bracing, gussets and cable supports.
 const structure=[],fasteners=[];for(let z=-12;z>=-42;z-=5){for(const side of [-1,1]){const x=side*10;structure.push(new THREE.BoxGeometry(.15,10,.65).translate(x,5,z));for(const dx of [-.22,.22])structure.push(new THREE.BoxGeometry(.1,10,.7).translate(x+dx,5,z));structure.push(new THREE.BoxGeometry(.9,.1,1).translate(x,.06,z));for(const dx of [-.32,.32])for(const dz of [-.35,.35])fasteners.push(new THREE.BoxGeometry(.08,.07,.08).translate(x+dx,.15,z+dz));}structure.push(new THREE.BoxGeometry(20,.3,.4).translate(0,9.6,z));for(let j=-9;j<10;j+=2){const b=new THREE.BoxGeometry(2.5,.085,.085);b.rotateZ((j%4===-1?1:-1)*.48);b.translate(j+1,9.1,z);structure.push(b);}structure.push(new THREE.BoxGeometry(20,.12,.2).translate(0,8.65,z));}rvBatch(structure,steel);rvBatch(fasteners,edge);
 rvBox(.4,10,36,-11,5,-26,concrete);rvBox(.4,10,36,11,5,-26,concrete);rvBox(22,.15,36,0,10,-26,dark);rvBox(22,10,.3,0,5,-44,concrete);
 for(const x of [-8,8]){rvTube([[x,9,-8],[x,8.9,-16],[x,8.85,-28],[x,8.9,-42]],.07,dark);for(let z=-12;z>-42;z-=4)rvBox(.22,.04,.08,x,9,z,edge);}
 // Long red luminaire is a source, with metal housing and support wires.
 rvBox(5.6,.16,.20,0,7.2,-36.8,dark);const tube=rvBox(5.4,.035,.07,0,7.11,-36.68,red);RV.signals.push(tube);for(const x of [-2.5,2.5])rvBox(.012,2.7,.012,x,8.65,-36.8,edge);
 // Dawn is only visible through the opening when the camera turns around.
 const dawnPlane=new THREE.Mesh(new THREE.PlaneGeometry(100,45),new THREE.MeshBasicMaterial({color:0xe8e3d8,side:THREE.DoubleSide,transparent:true,opacity:0,fog:false}));dawnPlane.position.set(0,15,17);scene.add(dawnPlane);RV.dawnPlane=dawnPlane;rvExterior();
};
// The entrance is a complete loading bay, not a flat wall in empty space.
function rvExterior(){const {concrete,steel,dark,edge,black}=mats;
 const trim=[],hardware=[];
 rvBox(32,.3,1.4,0,14.15,-8,steel);rvBox(.5,14,37,16,7,-26,concrete);
 // Cantilevered canopy: folded sheet, standing seams and diagonal stays.
 rvBox(10.6,.17,3.6,0,9.55,-6.25,dark);rvBox(10.6,.16,.10,0,9.4,-4.48,edge);
 for(let x=-5;x<=5;x+=.65)trim.push(new THREE.BoxGeometry(.025,.055,3.6).translate(x,9.67,-6.25));
 for(const x of [-4.3,4.3]){const b=new THREE.BoxGeometry(.08,2.4,.08);b.rotateX(.72);b.translate(x,10.5,-6.8);trim.push(b);}
 // A real mounting plate for the supplied artwork, with four standoffs.
 rvBox(10.8,1.8,.12,0,11.4,-7.25,black);
 for(const x of [-5.15,5.15])for(const y of [10.65,12.15])hardware.push(new THREE.BoxGeometry(.09,.09,.06).translate(x,y,-7.15));
 // Steel service windows and protective bars, deliberately quiet.
 for(const x of [-12,11.7]){rvBox(3.8,2.2,.16,x,9,-7.35,black);for(const dx of [-1.9,0,1.9])trim.push(new THREE.BoxGeometry(.055,2.2,.08).translate(x+dx,9,-7.22));for(const dy of [-1.1,0,1.1])trim.push(new THREE.BoxGeometry(3.85,.045,.08).translate(x,9+dy,-7.22));for(let dx=-1.6;dx<1.8;dx+=.4)trim.push(new THREE.BoxGeometry(.018,2.15,.03).translate(x+dx,9,-7.12));}
 // Expansion joints, foundation ledge, drain pipes and service duct.
 for(const x of [-15,-9,9,15]){rvBox(.035,13,.02,x,6.6,-7.47,black);rvTube([[x,14,-7.05],[x,12.6,-7.05],[x,1,-7.05],[x,.35,-6.7]],.065,dark);for(let y=2;y<13;y+=3)trim.push(new THREE.BoxGeometry(.22,.06,.12).translate(x,y,-7.03));}
 rvBox(11,.35,.42,-10,1,-7.25,dark);rvBox(11,.35,.42,10,1,-7.25,dark);
 rvBox(2.6,1.5,.45,11.5,5.6,-7.1,dark);for(let i=0;i<15;i++)trim.push(new THREE.BoxGeometry(2.4,.028,.13).translate(11.5,4.95+i*.085,-6.81));
 // Wall sconces have housing and protective cages, no decorative light bloom.
 for(const x of [-4.9,4.9]){rvBox(.22,.7,.25,x,6.6,-7.1,black);for(const dx of [-.11,.11])trim.push(new THREE.BoxGeometry(.025,.76,.04).translate(x+dx,6.6,-6.94));}
 // Alley masses give the facade a silhouette and a sense of location.
 rvBox(7,17,28,23.5,8.5,-20,dark);rvBox(5,11,23,-23,5.5,-21,dark);
 for(let z=-6;z>-33;z-=4){trim.push(new THREE.BoxGeometry(.14,1,2).translate(19.9,11,z));}
 // Loading apron: slab joints, curb cuts, two broken parking outlines.
 for(let z=-1;z<=15;z+=4)trim.push(new THREE.BoxGeometry(32,.009,.025).translate(0,.008,z));
 for(const x of [-12,-6,6,12])trim.push(new THREE.BoxGeometry(.025,.009,24).translate(x,.008,4));
 const marking=new THREE.MeshStandardMaterial({color:0x706b61,roughness:1});const marks=[];
 for(const side of [-1,1])for(let j=0;j<8;j++){marks.push(new THREE.BoxGeometry(.035,.007,.65).translate(side*8,.018,2+j*.9));}rvBatch(marks,marking);
 const puddleMat=new THREE.MeshStandardMaterial({color:0x151513,roughness:.14,metalness:.38,transparent:true,opacity:.75,depthWrite:false});
 for(const [x,z,sx,sz] of [[2,3,2.1,.8],[-4,0,1.3,.5],[7,9,2.7,.8],[-8,6,1.8,.7]]){const shape=new THREE.Shape();const r=mulberry32(Math.abs(x*13)+31);for(let n=0;n<16;n++){const a=n/16*TAU,rad=.78+r()*.22;const px=Math.cos(a)*rad,py=Math.sin(a)*rad;n?shape.lineTo(px,py):shape.moveTo(px,py);}shape.closePath();const m=new THREE.Mesh(new THREE.ShapeGeometry(shape),puddleMat);m.rotation.x=-Math.PI/2;m.scale.set(sx,sz,1);m.position.set(x,.022,z);scene.add(m);}
 rvBatch(trim,edge);rvBatch(hardware,steel);
}
function rvLogo(){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{const c=cvs(1024,148),ctx=c.getContext('2d');ctx.drawImage(img,48,426,936,148,0,0,1024,148);const texture=tx(c);texture.encoding=THREE.sRGBEncoding;const board=new THREE.Mesh(new THREE.PlaneGeometry(10.25,1.48),new THREE.MeshBasicMaterial({map:texture,toneMapped:true}));board.position.set(0,11.4,-7.16);scene.add(board);RV.logo=board;resolve();};img.onerror=()=>reject(new Error('Original RAVERS logo failed to load'));img.src='/assets/ravers-original-logo.png';});}
function rvTravel(p){const i=Math.floor(p);return i+smooth(...RV_CONFIG.travel,p-i);}
function rvSpeakers(){const {steel,dark,edge,black}=mats;const frame=[];const bolts=[];for(let side of [-1,1])for(let row=0;row<4;row++)for(let col=0;col<2;col++){const x=side*(3.4+col*1.68),y=.85+row*1.72,z=-35.8;rvBox(1.58,1.6,1.2,x,y,z,dark);for(const dx of [-.72,.72])frame.push(new THREE.BoxGeometry(.035,1.5,.04).translate(x+dx,y,z+.63));for(const dy of [-.71,.71])frame.push(new THREE.BoxGeometry(1.48,.03,.04).translate(x,y+dy,z+.63));const ring=new THREE.Mesh(new THREE.TorusGeometry(.58,.044,6,32),black);ring.position.set(x,y,z+.65);scene.add(ring);const cone=new THREE.Mesh(new THREE.ConeGeometry(.53,.2,32,1,true),new THREE.MeshStandardMaterial({color:0x292a25,roughness:.94,side:THREE.DoubleSide}));cone.rotation.x=Math.PI/2;cone.position.set(x,y,z+.62);scene.add(cone);const cap=new THREE.Mesh(new THREE.SphereGeometry(.16,12,8),black);cap.scale.z=.38;cap.position.set(x,y,z+.73);scene.add(cap);RV.cones.push({cone,cap,z:z+.62});for(const dx of [-.66,.66])for(const dy of [-.65,.65])bolts.push(new THREE.BoxGeometry(.036,.036,.02).translate(x+dx,y+dy,z+.66));}
 rvBatch(frame,edge);rvBatch(bolts,steel);
 // Mixing desk, two decks, faders, knobs and orderly patched cables.
 rvBox(4.1,1.45,1.3,0,.72,-32,dark);rvBox(4.35,.1,1.5,0,1.5,-32,steel);for(const x of [-1.24,1.24]){rvBox(1.05,.1,1.1,x,1.6,-32,black);const platter=new THREE.Mesh(new THREE.CylinderGeometry(.37,.37,.045,32),edge);platter.position.set(x,1.69,-32);scene.add(platter);}for(let i=0;i<5;i++){rvBox(.013,.01,.48,-.3+i*.15,1.61,-32,edge);rvBox(.095,.035,.055,-.3+i*.15,1.65,-32.15+i*.06,dark);}const knobs=[];for(let i=0;i<18;i++)knobs.push(new THREE.BoxGeometry(.047,.07,.047).translate(-.33+(i%6)*.13,1.65,-31.78+Math.floor(i/6)*.13));rvBatch(knobs,edge);
 for(let i=0;i<5;i++)rvTube([[-1+i*.45,1.4,-32.6],[-1+i*.45,.2,-33.3],[-2+i*.7,.04,-34],[3+i*.2,.04,-35]],.017,black);
 const tag=rvSign(['140'],1.8,.7,0,1,-31.32,{small:'BPM / ONE SHARED FREQUENCY'});
}
function rvObjects(){const {concrete,steel,dark,edge,black}=mats;
 // Foreground removable crowd barrier with linked mesh and feet.
 for(const side of [-1,1]){const g=new THREE.Group();g.position.set(side*7,.02,8);g.rotation.y=side*.16;scene.add(g);for(const x of [-2.5,2.5]){rvBox(.07,1.9,.07,x,.95,0,edge,g);rvBox(.7,.07,.7,x,.035,0,dark,g);}for(const y of [.28,1.65])rvBox(5,.045,.045,0,y,0,edge,g);const rods=[];for(let x=-2.4;x<2.5;x+=.14)rods.push(new THREE.BoxGeometry(.014,1.4,.014).translate(x,.97,0));rvBatch(rods,dark,g);}
 // Bollards, gutter grille and covers establish scale at the threshold.
 for(const x of [-5.1,5.1]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.13,.16,1.5,12),steel);p.position.set(x,.75,-4);scene.add(p);for(const y of [.9,1.03,1.16])rvBox(.28,.035,.29,x,y,-4,edge);}
 const drains=[];for(let i=0;i<90;i++)drains.push(new THREE.BoxGeometry(.045,.015,.45).translate(-6+i*.135,.004,-3.4));rvBatch(drains,edge);
 // Bare cable coil on the apron.
 for(let i=0;i<4;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.55+i*.027,.017,5,48),black);ring.rotation.x=Math.PI/2;ring.position.set(-6.4,.035+i*.02,-3);scene.add(ring);}
 // Left bay: a suspended fabric manifesto, sewn hem, hanging eyelets.
 for(let i=0;i<3;i++){const x=-7.8+i*2.25,z=-20-i*.8;const g=new THREE.PlaneGeometry(1.9,3.5,16,22),mat=new THREE.MeshStandardMaterial({map:rvPrint([['WEAR','THE NIGHT'],['FIND','YOUR PEOPLE'],['FOLLOW','THE SOUND']][i],{paper:i===1,seed:60+i}),roughness:1,side:THREE.DoubleSide});mat.onBeforeCompile=sh=>{sh.uniforms.uRVTime=WORLD.uT;sh.vertexShader='uniform float uRVTime;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.z += sin(position.x*2.2 + uRVTime*.55)*.055*pow(1.0-uv.y,2.0);');};const m=new THREE.Mesh(g,mat);m.position.set(x,5.2,z);m.rotation.y=.25;scene.add(m);RV.banners.push(m);for(const dx of [-.8,.8])rvBox(.012,3.1,.012,x+dx,8.45,z,edge);rvBox(2,.055,.055,x,7,z,steel);}
 // Mezzanine on the right: grated lip, rail uprights, small service door.
 rvBox(3.2,.22,13,9,5.5,-26,steel);const bal=[];for(let z=-32;z<-19;z+=.7)bal.push(new THREE.BoxGeometry(.04,1.15,.04).translate(7.45,6.15,z));bal.push(new THREE.BoxGeometry(.055,.055,13).translate(7.45,6.72,-25.8));rvBatch(bal,edge);rvBox(.12,3,1.4,10.75,7.1,-29,black);
 rvSign(['SAME','SOUND.','NEW','COMPANY.'],3,4,7,2.5,-28,{paper:true,seed:84}).rotation.y=-.7;
 // Gaffer marks and technical tape around the booth, kept monochrome.
 const tape=new THREE.MeshStandardMaterial({color:0xa49d8a,roughness:1});for(const side of [-1,1]){rvBox(.03,.005,2.2,side*2.5,.005,-31,tape);rvBox(.55,.005,.035,side*2.25,.005,-29.9,tape);}
 // The exit marker reads from inside and catches the dawn.
 const exit=rvSign(['WAY OUT'],2.1,.55,0,9,-8.65,{small:'SEE YOU ON THE OTHER SIDE'});exit.rotation.y=Math.PI;
}
function rvAtmosphere(){const texture=tx(texGlow('rgba(232,227,216,.32)','rgba(150,140,125,.04)'));WORLD.haze=[];for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(18,2.2),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,opacity:.035,fog:true}));m.position.set(i*4-4,.7,-14-i*9);m.userData={x0:m.position.x,ph:i};scene.add(m);WORLD.haze.push(m);}
 // Broken reflections are anchored to the red seam, elongated along the floor.
 const c=cvs(128,512),x=c.getContext('2d'),rnd=mulberry32(24);const gr=x.createLinearGradient(0,0,0,512);gr.addColorStop(0,'rgba(232,35,42,.42)');gr.addColorStop(1,'rgba(232,35,42,0)');x.fillStyle=gr;x.fillRect(0,0,128,512);x.globalCompositeOperation='destination-out';for(let i=0;i<80;i++){x.globalAlpha=rnd()*.8;x.fillRect(0,rnd()*512,128,1+rnd()*5);}const m=new THREE.Mesh(new THREE.PlaneGeometry(.5,12),new THREE.MeshBasicMaterial({map:tx(c),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.set(0,.015,-1.5);scene.add(m);RV.reflection=m;
}
// Keep the source card camera and compositor, with views into this same venue.
buildCards=function(){const defs=[{p:[-2,4,-14],t:[-6,5,-22],fov:43},{p:[3,3,-25],t:[0,3.8,-36],fov:47},{p:[1,3,-18],t:[7,3,-28],fov:44}];$$('[data-view]').forEach(el=>{if(CARDS.some(card=>card.el===el.querySelector('[data-frame]')))return;const d=defs[+el.dataset.view],c=new THREE.PerspectiveCamera(d.fov,4/5,.3,150);c.position.set(...d.p);c.lookAt(...d.t);c.layers.set(0);c.userData={home:c.position.clone(),look:new THREE.Vector3(...d.t),push:0,want:0};CARDS.push({cam:c,el:el.querySelector('[data-frame]'),rect:null});el.addEventListener('pointerenter',()=>c.userData.want=1);el.addEventListener('pointerleave',()=>c.userData.want=0);el.addEventListener('focus',()=>c.userData.want=1);el.addEventListener('blur',()=>c.userData.want=0);});};
layoutWord=function(){if(WORD.group)WORD.group.visible=false;WORD.rise=0;};
placeMoon=function(){};
fitAspect=function(p,t,fov){const a=aspectFix();if(a>0){_d.subVectors(p,t).normalize();p.addScaledVector(_d,a*(RIG.smooth<.8?7:2));return fov*(1+a*.18);}return fov;};
updateWorld=function(dt){WORLD.uT.value=clock;const p=RIG.smooth,dawn=smooth(...RV_CONFIG.dawn,p),beat=RV.paused?0:Math.pow(.5+.5*Math.cos(clock*TAU*RV_CONFIG.tempo/60),10);const open=smooth(...RV_CONFIG.doorOpen,p);
 RV.doors.forEach(({hinge,side})=>hinge.rotation.y=side*open*1.45);RV.seam.scale.x=.035*(1-open);RV.seam.visible=open<.95;RV.seamLight.intensity=(4.2+beat*.25)*(1-dawn);RV.backLight.intensity=(3.8+beat*.35)*(1-dawn);RV.signals.forEach(m=>m.visible=dawn<.95);RV.reflection.material.opacity=(1-open*.9)*(1-dawn);RV.dawn.intensity=dawn*2.6;RV.dawnPlane.material.opacity=dawn;RV.hemi.intensity=.42+dawn*.4;
 for(const c of RV.cones){c.cone.position.z=c.z+beat*.032;c.cap.position.z=c.z+.11+beat*.032;}WORLD.haze.forEach(m=>{m.position.x=m.userData.x0+Math.sin(clock*.07+m.userData.ph)*1.2;m.material.opacity=.035+dawn*.025;m.quaternion.copy(camera.quaternion);});
 if(WORD.group){const near=smooth(.05,.88,p);WORD.glyphs.forEach((g,i)=>{const e=easeOut(sat((WORD.reveal-i*.04)/.62));g.position.y=g.userData.baseY-(1-e)*WORD.ink.asc;g.material.opacity=e*(1-near);g.visible=g.material.opacity>.004;});}
 CARDS.forEach(C=>{const u=C.cam.userData;u.push=damp(u.push,u.want,3.4,dt);});
 if(WORLD.key&&WANT_SHADOW&&open!==RV.lastOpen){WORLD.key.shadow.needsUpdate=true;RV.lastOpen=open;}

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
