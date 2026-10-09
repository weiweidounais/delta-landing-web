"use client";
import {useCallback,useEffect,useState} from "react";
import {Copy,RefreshCw,MapPin,Clock3,Check,Radio,TriangleAlert} from "lucide-react";
import {toast} from "sonner";
import {Toaster} from "@/components/ui/sonner";
import {chinaDate,currentSnapshot,waiting,SOURCES,type PasswordData,type Candidate} from "@/lib/password-model";
const sourceName=(id:string)=>SOURCES.find(s=>s.id===id)?.name??id;
export function PasswordSection(){
 const [data,setData]=useState<PasswordData|null>(null),[loading,setLoading]=useState(false),[copied,setCopied]=useState<string|null>(null);
 const refresh=useCallback(async()=>{
  setLoading(true);
  try{
   const r=await fetch("/api/passwords",{cache:"no-store"});const result=await r.json() as PasswordData;
   if(!Array.isArray(result.entries))throw Error("Invalid data");
   setData(currentSnapshot(result,new Date()));
  }catch{setData(waiting(new Date(),"暂时无法同步，稍后自动重试"))}
  finally{setLoading(false)}
 },[]);
 useEffect(()=>{
  void refresh();const retry=setInterval(()=>void refresh(),5*60000);
  const clock=setInterval(()=>setData(previous=>previous?.fetchedAt&&chinaDate(new Date(previous.fetchedAt))!==chinaDate(new Date())?waiting(new Date()):previous),30000);
  const onFocus=()=>void refresh();window.addEventListener("focus",onFocus);
  return()=>{clearInterval(retry);clearInterval(clock);window.removeEventListener("focus",onFocus)};
 },[refresh]);
 const copy=async(id:string,code:string)=>{
  try{await navigator.clipboard.writeText(code);setCopied(id);toast.success("密码已复制");setTimeout(()=>setCopied(null),1800)}
  catch{toast.error("复制失败，请手动选择密码")}
 };
 const view=data??waiting(new Date());
 const time=(s:string)=>new Intl.DateTimeFormat("zh-CN",{timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(new Date(s));
 const count=view.entries.filter(x=>x.doors[0].candidates.length).length;
 const renderCandidate=(candidate:Candidate,id:string,doorLabel:string,mapName:string)=><div className={"password-candidate "+(candidate.needsVerification?"needs-verification":"")} key={id}>
  <div className="access-code"><span>{candidate.code}</span><button onClick={()=>void copy(id,candidate.code)} aria-label={"复制"+mapName+(doorLabel==="main"?"":doorLabel)+"密码"+candidate.code}>{copied===id?<Check size={21}/>:<Copy size={21}/>}</button></div>
  <div className="candidate-sources">{candidate.sources.map(source=><span key={source}>{sourceName(source)}</span>)}{candidate.sources.length>1&&<b>同码已合并</b>}</div>
  {!!candidate.locations.length&&<p className="candidate-location"><MapPin size={15}/>{candidate.locations.join("；")}</p>}
  {candidate.updates.map(update=><p className="candidate-update" key={update.source+update.at}>{sourceName(update.source)} 数据更新：{update.at}{update.olderRecord&&<strong>较早记录 · 需核实</strong>}</p>)}
 </div>;
 return <section id="passwords" className="password-section section-shell">
  <div className="section-label"><span>04 / 每日密码</span><span>DAILY ACCESS CODES</span></div>
  <div className="section-heading"><div><p className="eyebrow">行动前，再确认一次</p><h2>密码在手，<span>开启探索</span></h2></div><button className="refresh-button" disabled={loading} onClick={()=>void refresh()}><RefreshCw size={17} className={loading?"spinning":""}/>{loading?"同步中":"刷新密码"}</button></div>
  <div className="password-status"><span><Radio size={16}/>{loading&&!data?"正在汇总两个来源":count+" / 6 张地图常规密码已获取"}</span><span><Clock3 size={16}/>{view.fetchedAt?"汇总于 "+time(view.fetchedAt):"今日密码待更新"}</span><span>北京时间 · 每日 02:00 同步</span></div>
  <div className="password-grid">{view.entries.map((entry,i)=><article className={"password-card "+(!entry.doors[0].candidates.length?"is-pending":"")} key={entry.id}>
   <div className="password-card-top"><span>MAP / 0{i+1}</span><span className={"code-status "+(entry.doors[0].status==="conflict"?"has-conflict":"")}>{entry.doors[0].status==="conflict"?"来源有差异":entry.doors[0].candidates.length?"已获取":"待更新"}</span></div><h3>{entry.name}</h3>
   {entry.doors.map(door=><div className={"password-door "+(door.id!=="main"?"password-door-extra":"")} key={door.id}>
    {(entry.doors.length>1||door.status==="conflict")&&<div className="door-label"><span>{door.label}</span>{door.status==="conflict"&&<strong><TriangleAlert size={14}/>来源存在差异，请核对</strong>}</div>}
    {door.candidates.length?door.candidates.map(c=>renderCandidate(c,entry.id+"-"+door.id+"-"+c.code,door.id==="main"?"main":"彩六联动房",entry.name)):<><div className="access-code"><span>— — — —</span><button disabled aria-label={"复制"+entry.name+door.label+"密码"}><Copy size={21}/></button></div><p className="candidate-location">密码待更新</p></>}
   </div>)}
  </article>)}</div>
  <div className="password-source-summary" aria-label="密码来源同步状态">{SOURCES.map(source=>{
   const state=view.sources.find(s=>s.id===source.id);
   return <div key={source.id} className={state?.status==="error"?"source-unavailable":""}><b>{source.name}</b><span>{state?.status==="error"?"暂不可用 · 稍后自动重试":state?.status==="ready"?"已获取 "+state.entries.filter(e=>e.code).length+" 条记录":"待更新"}</span><small>{state?.fetchedAt?"抓取于 "+time(state.fetchedAt):"等待下次同步"}</small></div>;
  })}</div>
  <div className="source-note"><span>{view.error??"按地图、门类型与密码去重；相同密码合并来源，不同密码分别保留。"}</span><span>来源：KKRB · Delta Force Codes</span></div>
  <p className="password-date-note">抓取时间与来源数据更新时间都不代表密码生效日期。KKRB 未注明更新时间的时区；较早记录已单独提示，出发前请核实。</p>
  <Toaster position="bottom-right" theme="dark"/>
 </section>;
}
