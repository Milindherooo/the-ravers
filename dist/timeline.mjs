// Master choreography. Everything architectural is a pure function of scroll.
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t)};
export const mix=(a,b,t)=>a+(b-a)*t;
export const CONFIG={screens:12,dprDesktop:1.5,dprMobile:1,maxPixels:2100000,tempo:140,
stops:[
{p:0,pos:[-4.8,3.7,16.5],look:[-3.3,4.5,0],fov:47},
{p:.085,pos:[-4.4,3.9,15],look:[-2.8,4.4,0],fov:47},
{p:.21,pos:[0,4.2,5],look:[0,4.3,-18],fov:52},
{p:.30,pos:[0,4,-6],look:[0,4.2,-31],fov:55},
{p:.37,pos:[-1.5,4.1,-11],look:[1.4,4.8,-35],fov:55},
{p:.44,pos:[-1,4.1,-12],look:[1,4.8,-35],fov:54},
{p:.56,pos:[3.8,4.1,-26],look:[0,5,-37],fov:52},
{p:.62,pos:[3.2,4.3,-27],look:[0,5,-37],fov:52},
{p:.72,pos:[4.2,4.7,-20],look:[-6,4.8,-24],fov:54},
{p:.78,pos:[4.2,4.7,-19],look:[-6,4.8,-24],fov:54},
{p:.88,pos:[3.6,4.3,-17],look:[0,4.5,0],fov:54},
{p:.96,pos:[1.8,4.1,-8],look:[0,4.4,1],fov:51},
{p:1,pos:[1.5,4.1,-7],look:[0,4.4,1],fov:51}],
chapters:[{name:'THE SIGNAL',at:0},{name:'CROSS OVER',at:.21},{name:'THE FREQUENCY',at:.37},{name:'THE HEART',at:.56},{name:'THE CULTURE',at:.74},{name:'FIRST LIGHT',at:.97}],
copy:[[-.1,0,.065,.14],[.18,.205,.24,.275],[.305,.35,.41,.455],[.49,.54,.595,.645],[.68,.72,.77,.82],[.895,.94,1,1.1]],boundaries:[.16,.29,.47,.665,.86]};
export function cameraAt(p,mobile=false){p=clamp(p);const s=CONFIG.stops;let i=0;while(i<s.length-2&&p>s[i+1].p)i++;const a=s[i],b=s[i+1],t=smooth(a.p,b.p,p);const pos=a.pos.map((v,k)=>mix(v,b.pos[k],t));const look=a.look.map((v,k)=>mix(v,b.look[k],t));if(mobile){const intro=1-smooth(.08,.24,p);pos[0]=mix(pos[0],0,intro);pos[2]+=intro*3.8;pos[1]+=intro*1.4;look[0]=mix(look[0],0,intro);look[1]+=intro*1.3;}return {pos,look,fov:mix(a.fov,b.fov,t)+(mobile?9:0)}}
export function stateAt(p){p=clamp(p);return {door:smooth(.065,.225,p)*1.46,dawn:smooth(.865,.995,p),chapter:CONFIG.boundaries.filter(v=>p>=v).length,copy:CONFIG.copy.map(([a,b,c,d])=>smooth(a,b,p)*(1-smooth(c,d,p))),clock:Math.round(23*60+p*420)%(24*60)}}
