/* Deterministic capture for review stills and video renders. Inert unless the
   page is opened with ?capture=1. It drives the real frame() path with a
   synthetic clock instead of requestAnimationFrame: no second loop or renderer. */
const RV_CAPTURE={on:Q.get('capture')==='1',now:0};
if(RV_CAPTURE.on){
 PERF.locked=true;
 const rvCaptureQueue=queue;queue=function(){if(!RV_CAPTURE.on)rvCaptureQueue();};
 const rvCaptureStart=start;start=function(){rvCaptureStart();running=true;RV_CAPTURE.now=1000;tPrev=RV_CAPTURE.now;
  window.__ravers.capture={
   // Advance one real frame by dt seconds with the document scrolled to y.
   step(y,dt=1/30){scrollTo(0,y);RV_CAPTURE.now+=dt*1000;RV.dirty=true;frame(RV_CAPTURE.now);return {y:scrollY,progress:RIG.prog,smooth:RIG.smooth,clock};},
   // Arrive at y with the damped camera already settled, then render one frame.
   pose(y,dt=1/30){scrollTo(0,y);RIG.prog=RIG.smooth=rvTravel(progressFor(scrollY));return this.step(y,dt);},
   // Render the world state at y from an arbitrary camera, to preview a planned view.
   look(y,pos,target,fov){this.pose(y);camera.position.set(...pos);camera.lookAt(...target);if(fov)camera.fov=fov;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);render();return {y:scrollY,progress:RIG.prog};},
   // Scroll offset for a raw chapter progress in [0,5], between the real anchors.
   scrollFor(p){const a=anchors,i=Math.max(0,Math.min(a.length-2,Math.floor(p)));return Math.round(a[i]+(a[i+1]-a[i])*(p-i));},
   maxScroll:()=>document.documentElement.scrollHeight-innerHeight
  };
  window.dispatchEvent(new Event('ravers:capture-ready'));
 };
}
