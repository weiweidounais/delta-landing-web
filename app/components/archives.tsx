"use client";
import {useState} from "react";
import {Tabs,TabsList,TabsTrigger,TabsContent} from "@/components/ui/tabs";
import {ChevronLeft,ChevronRight,Shield,Target} from "lucide-react";
import game from "@/data/game.json";
export function OperatorSection(){
 const [selected,setSelected]=useState("威龙");const operators=game.operators;
 const move=(step:number)=>{const index=operators.findIndex(x=>x.name===selected);setSelected(operators[(index+step+operators.length)%operators.length].name)};
 return <section id="operators" className="archives-section section-shell">
 <div className="section-label"><span>02 / 干员档案</span><span>G.T.I. OPERATOR ARCHIVE</span></div>
 <div className="section-heading"><div><p className="eyebrow">不同的专长，同一个目标</p><h2>找到你的<span>战术搭档</span></h2></div><p>17 位干员 · 四类兵种<br/><small>选择头像，了解干员与技能</small></p></div>
 <Tabs value={selected} onValueChange={setSelected} className="operator-tabs">
 <TabsList className="operator-list" aria-label="选择干员">{operators.map((o,i)=><TabsTrigger key={o.name} value={o.name} className="operator-tab" aria-label={"选择干员"+o.name}><img src={o.portrait} alt="" loading="lazy"/><span>{o.name}</span><small>{String(i+1).padStart(2,"0")}</small></TabsTrigger>)}</TabsList>
 {operators.map((o,i)=><TabsContent value={o.name} key={o.name} className="operator-panel">
 <article className="operator-stage" key={o.name}><img className="operator-art" src={o.image} alt={o.name+"人物展示"} loading="lazy"/><div className="stage-shade"/><div className="stage-grid" aria-hidden="true"/><div className="light-sweep" aria-hidden="true"/>
 <div className="operator-info"><p className="operator-number">G.T.I. / OPERATOR {String(i+1).padStart(2,"0")}</p><div className="class-badge"><img src={o.classIcon} alt=""/>{o.class}</div><h3>{o.name}</h3><p className="operator-name">{o.real_name} <span>{o.english_name}</span></p><p className="operator-background">{o.background}</p><p className="class-description"><Shield size={17}/>{o.class_description}</p></div>
 <div className="stage-bottom"><span>烽火地带 / 干员技能</span><div><button onClick={()=>move(-1)} aria-label="上一位干员"><ChevronLeft size={20}/></button><span>{String(i+1).padStart(2,"0")} / 17</span><button onClick={()=>move(1)} aria-label="下一位干员"><ChevronRight size={20}/></button></div></div></article>
 <div className="skill-grid">{o.skills.map((s,index)=><article className="skill" key={s.name}><div className="skill-title"><img src={s.icon} alt="" loading="lazy"/><div><span>干员技能</span><h4>{s.name}</h4></div><b>{String(index+1).padStart(2,"0")}</b></div><p>{s.description}</p></article>)}</div>
 </TabsContent>)}
 </Tabs></section>;
}
export function WeaponSection(){
 const [selected,setSelected]=useState(game.weapons[0].name);
 const short=(s:string)=>s.replace(/战斗步枪|冲锋枪|霰弹枪|通用机枪|射手步枪|狙击步枪/g,"");
 return <section id="weapons" className="weapons-section section-shell"><div className="section-label"><span>03 / 武器库</span><span>WEAPON SYSTEMS</span></div><div className="section-heading"><div><p className="eyebrow">应对每一次战术交锋</p><h2>你的武器，<span>你的选择</span></h2></div><p>官网展示枪械<br/><small>了解特点，选择适合的武器</small></p></div>
 <Tabs value={selected} onValueChange={setSelected} className="weapon-tabs"><TabsList className="weapon-list" aria-label="选择枪械">{game.weapons.map(w=><TabsTrigger key={w.name} value={w.name} className="weapon-tab" aria-label={"选择枪械"+short(w.name)}><img src={w.thumbnail} alt="" loading="lazy"/><span>{short(w.name)}</span><small>{w.name.replace(short(w.name),"")}</small></TabsTrigger>)}</TabsList>
 {game.weapons.map((w,i)=><TabsContent value={w.name} key={w.name} className="weapon-panel"><div className="weapon-stage"><img src={w.image} alt={w.name+"官方展示及改装细节"} loading="lazy"/><span className="weapon-index">ARMORY / 0{i+1}</span></div><div className="weapon-description"><div><Target size={22}/><h3>{w.name}</h3></div><p>{w.description}</p><span>G.T.I. / 标准武器档案</span></div></TabsContent>)}</Tabs></section>;
}