'use client';
// Adapted from WatermelonCorp/watermelon-platform, Card Split Accordian.
// Retains openIndex / adjacent-boundary splitting and Motion layout behavior.
// RAVERS changes: content slots, controlled state, keyboard semantics, sharp
// corners, reduced motion, and FLIP layout in place of per-frame height animation.
import React,{useId,type FC,type ReactNode} from 'react';
import {motion,MotionConfig,useReducedMotion} from 'motion/react';
import {ArrowUpRight,Plus,Minus} from 'lucide-react';
import useMeasure from 'react-use-measure';
export interface AccordionItemData{id:number;title:string;content:string;view:number;href:string;cta:string;}
interface ItemProps{item:AccordionItemData;setOpenId:(id:number|null)=>void;index:number;total:number;openIndex:number;}
const springTransition={type:'spring' as const,stiffness:400,damping:42,mass:1};
const AccordionItem:FC<ItemProps>=({item,setOpenId,index,total,openIndex})=>{
 const [ref,bounds]=useMeasure();const reduce=useReducedMotion();const id=useId();
 const isOpen=index===openIndex,isFirst=index===0,isLast=index===total-1;
 const isBeforeOpen=index===openIndex-1,isAfterOpen=index===openIndex+1;
 const isAlone=(isAfterOpen&&isLast)||(isBeforeOpen&&isFirst);
 const top=isFirst||isAfterOpen||isOpen,bottom=isLast||isBeforeOpen||isOpen;
 return <motion.li layout={!reduce} className="split-item" data-open={isOpen} style={{marginBlock:isOpen?12:0}} transition={reduce?{duration:0}:springTransition}>
  <motion.div layout={!reduce} className="split-shell" style={{borderTopWidth:top?1:0,borderBottomWidth:bottom?1:0,borderTopLeftRadius:isOpen||isAlone||isAfterOpen||isFirst?2:0,borderTopRightRadius:isOpen||isAlone||isAfterOpen||isFirst?2:0,borderBottomLeftRadius:isOpen||isAlone||isBeforeOpen||isLast?2:0,borderBottomRightRadius:isOpen||isAlone||isBeforeOpen||isLast?2:0}}>
   <button type="button" id={id+'-trigger'} onClick={()=>setOpenId(isOpen?null:item.id)} aria-expanded={isOpen} aria-controls={id+'-panel'} className="split-trigger"><span>{item.title}</span><motion.span aria-hidden="true" animate={{rotate:isOpen?180:0}} transition={{duration:reduce?0:.42}}>{isOpen?<Minus size={18}/>:<Plus size={18}/>}</motion.span></button>
   <motion.div layout={!reduce} id={id+'-panel'} role="region" aria-labelledby={id+'-trigger'} aria-hidden={!isOpen} inert={!isOpen} className="split-body" style={{height:isOpen?(bounds.height||'auto'):0}}>
    <div ref={ref}><motion.div initial={false} animate={{opacity:isOpen?1:0,y:isOpen?0:8}} transition={{duration:reduce?0:.32}}>
     <div className="split-view" data-view={item.view} aria-hidden="true"><span data-frame className="split-view-frame"/></div>
     <div className="split-description"><p>{item.content}</p><a href={item.href}>{item.cta}<ArrowUpRight size={17} aria-hidden="true"/></a></div>
    </motion.div></div>
   </motion.div>
  </motion.div>
 </motion.li>;
};
export function CardSplitAccordion({items,openId,onChange}:{items:AccordionItemData[];openId:number|null;onChange:(id:number|null)=>void}){
 const reduced=useReducedMotion();const openIndex=items.findIndex(i=>i.id===openId);
 return <MotionConfig reducedMotion="user" transition={reduced?{duration:0}:springTransition}><ul className="split-accordion">{items.map((item,index)=><AccordionItem key={item.id} item={item} setOpenId={onChange} index={index} total={items.length} openIndex={openIndex}/>)}</ul></MotionConfig>;
}
