"use client";
import {useEffect,useState} from "react";
import useEmblaCarousel from "embla-carousel-react";
import {Tabs,TabsList,TabsTrigger,TabsContent} from "@/components/ui/tabs";
import {ChevronLeft,ChevronRight,Shield,Target} from "lucide-react";
import game from "@/data/game.json";
export function OperatorSection(){
 const [selected,setSelected]=useState("威龙");const operators=game.operators;
 const [carouselRef,carousel]=useEmblaCarousel({loop:true,align:"center",startIndex:operators.findIndex(o=>o.name==="威龙"),watchFocus:false,duration:25});
 const move=(step:number)=>setSelected(previous=>{const index=operators.findIndex(x=>x.name===previous);return operators[(index+step+operators.length)%operators.length].name});
 useEffect(()=>{
  if(!carousel)return;
  const select=()=>setSelected(operators[carousel.selectedScrollSnap()].name);
  carousel.on("select",select).on("reInit",select);
  return()=>{carousel.off("select",select).off("reInit",select)};
 },[carousel,operators]);
 useEffect(()=>{
  if(carousel)carousel.scrollTo(operators.findIndex(o=>o.name===selected),window.matchMedia("(prefers-reduced-motion: reduce)").matches);
 },[carousel,operators,selected]);
 useEffect(()=>{
  if(!carousel)return;
  let total=0,last=0,blockedUntil=0;
  const wheel=(event:WheelEvent)=>{
   if(event.ctrlKey)return;
   const delta=Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY;
   if(!delta)return;
   event.preventDefault();
   const now=performance.now();
   if(now<blockedUntil)return;
   if(now-last>220)total=0;
   total+=delta*(event.deltaMode===1?16:event.deltaMode===2?carousel.rootNode().clientWidth:1);last=now;
   if(Math.abs(total)<32)return;
   if(total>0)carousel.scrollNext();else carousel.scrollPrev();
   total=0;blockedUntil=now+180;
  };
  const viewport=carousel.rootNode();
  viewport.addEventListener("wheel",wheel,{passive:false});
  return()=>viewport.removeEventListener("wheel",wheel);
 },[carousel]);
 return <section id="operators" className="archives-section section-shell">
 <div className="section-label"><span>02 / 干员档案</span><span>G.T.I. OPERATOR ARCHIVE</span></div>
 <div className="section-heading"><div><p className="eyebrow">不同的专长，同一个目标</p><h2>找到你的<span>战术搭档</span></h2></div><p>17 位干员 · 四类兵种<br/><small>滚动或拖动选择，了解干员与技能</small></p></div>
 <Tabs value={selected} onValueChange={setSelected} className="operator-tabs">
 <div className="operator-carousel" aria-label="干员循环选择">
 <button className="operator-scroll-control" onClick={()=>move(-1)} aria-label="循环选择上一位干员"><ChevronLeft size={22}/></button>
 <div className="operator-carousel-viewport" ref={carouselRef}>
 <TabsList className="operator-list" aria-label="选择干员" onKeyDownCapture={event=>{
  const index=operators.findIndex(o=>o.name===selected);
  const target=event.key==="ArrowRight"?(index+1)%operators.length:event.key==="ArrowLeft"?(index-1+operators.length)%operators.length:event.key==="Home"?0:event.key==="End"?operators.length-1:null;
  if(target===null)return;
  event.preventDefault();event.stopPropagation();
  setSelected(operators[target].name);
  // Native focus scrolling would offset Embla's looping track.
  (carousel?.slideNodes()[target] as HTMLElement|undefined)?.focus({preventScroll:true});
 }} >{operators.map(o=><TabsTrigger key={o.name} value={o.name} className="operator-tab" aria-label={"选择干员"+o.name} onMouseDown={event=>event.preventDefault()} onClick={event=>{setSelected(o.name);event.currentTarget.focus({preventScroll:true})}}><img src={o.portrait} alt="" loading="lazy" draggable={false}/><span>{o.name}</span></TabsTrigger>)}</TabsList>
 </div>
 <button className="operator-scroll-control" onClick={()=>move(1)} aria-label="循环选择下一位干员"><ChevronRight size={22}/></button>
 </div>
 {operators.map((o,i)=><TabsContent value={o.name} key={o.name} className="operator-panel">
 <article className="operator-stage" key={o.name}><img className="operator-art" src={o.image} alt={o.name+"人物展示"} loading="lazy"/><div className="stage-shade"/><div className="stage-grid" aria-hidden="true"/><div className="light-sweep" aria-hidden="true"/>
 <div className="operator-info"><p className="operator-number">G.T.I. / OPERATOR {String(i+1).padStart(2,"0")}</p><div className="class-badge"><img src={o.classIcon} alt=""/>{o.class}</div><h3>{o.name}</h3><p className="operator-name">{o.real_name} <span>{o.english_name}</span></p><p className="operator-background">{o.background}</p><p className="class-description"><Shield size={17}/>{o.class_description}</p></div>
 <div className="stage-bottom"><span>烽火地带 / 干员技能</span><div><button onClick={()=>move(-1)} aria-label="上一位干员"><ChevronLeft size={20}/></button><span>{String(i+1).padStart(2,"0")} / 17</span><button onClick={()=>move(1)} aria-label="下一位干员"><ChevronRight size={20}/></button></div></div></article>
 <div className="skill-grid">{o.skills.map((s,index)=><article className="skill" key={s.name}><div className="skill-title"><img src={s.icon} alt="" loading="lazy"/><div><span>干员技能</span><h4>{s.name}</h4></div><b>{String(index+1).padStart(2,"0")}</b></div><p>{s.description}</p></article>)}</div>
 </TabsContent>)}
 </Tabs></section>;
}
export function WeaponSection(){
 const [turn,setTurn]=useState<{name:string;previous:string|null;direction:number;revision:number}>({name:game.weapons[0].name,previous:null,direction:1,revision:0});
 const selectWeapon=(name:string)=>setTurn(current=>{
  if(name===current.name)return current;
  const index=game.weapons.findIndex(w=>w.name===name),previousIndex=game.weapons.findIndex(w=>w.name===current.name);
  return {name,previous:current.name,direction:index>previousIndex?1:-1,revision:current.revision+1};
 });
 const finishTurn=(name:string,revision:number)=>setTurn(current=>current.previous===name&&current.revision===revision?{...current,previous:null}:current);
 const short=(s:string)=>s.replace(/战斗步枪|冲锋枪|霰弹枪|通用机枪|射手步枪|狙击步枪/g,"");
 return <section id="weapons" className="weapons-section section-shell"><div className="section-label"><span>03 / 武器库</span><span>WEAPON SYSTEMS</span></div><div className="section-heading"><div><p className="eyebrow">应对每一次战术交锋</p><h2>你的武器，<span>你的选择</span></h2></div><p>官网展示枪械<br/><small>了解特点，选择适合的武器</small></p></div>
 <Tabs value={turn.name} onValueChange={selectWeapon} className="weapon-tabs"><TabsList className="weapon-list" aria-label="选择枪械">{game.weapons.map(w=><TabsTrigger key={w.name} value={w.name} className="weapon-tab" aria-label={"选择枪械"+short(w.name)}><img src={w.thumbnail} alt="" loading="lazy"/><span>{short(w.name)}</span><small>{w.name.replace(short(w.name),"")}</small></TabsTrigger>)}</TabsList>
 <div className="weapon-rotation-view">
 {game.weapons.map((w,i)=><TabsContent forceMount value={w.name} key={w.name} className="weapon-panel" data-turn={w.name===turn.name?"in":w.name===turn.previous?"out":"rest"} data-direction={turn.direction>0?"next":"previous"} data-animated={turn.revision>0} aria-hidden={w.name!==turn.name} inert={w.name!==turn.name} tabIndex={w.name===turn.name?0:-1} onAnimationEnd={event=>{if(event.target===event.currentTarget&&event.animationName.startsWith("weapon-turn-out"))finishTurn(w.name,turn.revision)}}><div className="weapon-stage"><img src={w.image} alt={w.name+"官方展示及改装细节"} width={3840} height={2110} loading="lazy"/><span className="weapon-index">ARMORY / 0{i+1}</span></div><div className="weapon-description"><div><Target size={22}/><h3>{w.name}</h3></div><p>{w.description}</p><span>G.T.I. / 标准武器档案</span></div></TabsContent>)}
 </div></Tabs></section>;
}
