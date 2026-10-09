export const MAPS = [
 {id:"zero-dam",name:"零号大坝"},{id:"layali-grove",name:"长弓溪谷"},
 {id:"brakkesh",name:"巴克什"},{id:"space-city",name:"航天基地"},
 {id:"tide-prison",name:"潮汐监狱"},{id:"az3",name:"AZ3"}
];
export const SOURCES = [
 {id:"kkrb",name:"KKRB",url:"https://www.kkrb.net/?theme=dark&viewpage=view%2Fmap%2Fbonus_door"},
 {id:"deltaforce",name:"Delta Force Codes",url:"https://deltaforce.codes/zh"}
] as const;
export type SourceId = typeof SOURCES[number]["id"];
export type DoorId = "main"|"siege";
export type SourceRecord = {
 mapId:string;door:DoorId;code:string|null;location:string;updatedAt:string|null;olderRecord:boolean
};
export type SourceSnapshot = {
 id:SourceId;name:string;url:string;fetchedAt:string|null;sourceDate:string|null;region:string|null;
 status:"ready"|"pending"|"error";error:string|null;entries:SourceRecord[]
};
export type Candidate = {
 code:string;sources:SourceId[];locations:string[];
 updates:{source:SourceId;at:string;olderRecord:boolean}[];needsVerification:boolean
};
export type PasswordDoor = {id:DoorId;label:string;candidates:Candidate[];status:"ready"|"pending"|"conflict"};
export type PasswordEntry = {id:string;name:string;code:string|null;location:string;doors:PasswordDoor[]};
export type PasswordData = {
 schemaVersion:2;entries:PasswordEntry[];sources:SourceSnapshot[];fetchedAt:string|null;
 sourceDate:string|null;region:string|null;status:"ready"|"pending"|"error";error:string|null;nextUpdateAt:string
};
export function chinaDate(date:Date){return new Date(date.getTime()+8*3600000).toISOString().slice(0,10)}
export function chinaHour(date:Date){return new Date(date.getTime()+8*3600000).getUTCHours()}
export function nextUpdate(date:Date){
 const target=new Date(chinaDate(date)+"T02:00:00+08:00");
 if(target.getTime()<=date.getTime())target.setUTCDate(target.getUTCDate()+1);
 return target.toISOString();
}
export function sourceFailure(id:SourceId,error:string):SourceSnapshot{
 return {...SOURCES.find(s=>s.id===id)!,fetchedAt:null,sourceDate:null,region:null,status:"error",error,entries:[]};
}
export function waiting(now:Date,error:string|null=null):PasswordData{
 return {schemaVersion:2,entries:MAPS.map(m=>({...m,code:null,location:"",
 doors:[{id:"main",label:"常规密码门",candidates:[],status:"pending"}]})),
 sources:[],fetchedAt:null,sourceDate:null,region:null,status:error?"error":"pending",error,nextUpdateAt:nextUpdate(now)};
}
function isCurrent(time:string,now:Date){
 const parsed=Date.parse(time);
 return Number.isFinite(parsed)&&chinaDate(new Date(parsed))===chinaDate(now)&&parsed<=now.getTime()+60000;
}
export function normalizeDeltaSource(raw:unknown,now:Date):SourceSnapshot{
 if(!raw||typeof raw!=="object")throw new Error("来源未返回密码数据");
 const data=raw as Record<string,unknown>;
 if(!Array.isArray(data.entries))throw new Error("来源数据格式不完整");
 if(data.stale===true||data.error)throw new Error("来源数据过期或同步异常");
 if(typeof data.fetchedAt!=="string"||!isCurrent(data.fetchedAt,now))throw new Error("来源未取得本日数据");
 const sourceDate=typeof data.sourceDate==="string"?data.sourceDate.slice(0,10):null;
 if(sourceDate&&sourceDate!==chinaDate(now))throw new Error("来源标注的适用日期不是今天");
 const entries:SourceRecord[]=MAPS.map(map=>{
  const value=(data.entries as Record<string,unknown>[]).find(x=>x&&x.id===map.id);
  return {mapId:map.id,door:"main",code:typeof value?.code==="string"&&/^\d{4}$/.test(value.code)?value.code:null,
   location:typeof value?.location==="string"?value.location.trim().slice(0,300):"",updatedAt:null,olderRecord:false};
 });
 return {...SOURCES[1],fetchedAt:data.fetchedAt,sourceDate,region:typeof data.region==="string"?data.region:null,
  status:entries.some(x=>x.code)?"ready":"pending",error:null,entries};
}
const KKR_MAPS=[
 {key:"db",mapId:"zero-dam",door:"main"},{key:"cgxg",mapId:"layali-grove",door:"main"},
 {key:"bks",mapId:"brakkesh",door:"main"},{key:"htjd",mapId:"space-city",door:"main"},
 {key:"cxjy",mapId:"tide-prison",door:"main"},{key:"az3",mapId:"az3",door:"main"},
 {key:"az3r6",mapId:"az3",door:"siege"}
] as const;
function kkrUpdated(value:unknown){
 if(typeof value!=="string"||!/^\d{14}$/.test(value))return null;
 const date=value.slice(0,4)+"-"+value.slice(4,6)+"-"+value.slice(6,8);
 // Validate the calendar date without assigning a timezone to the source's plain text.
 const parsed=new Date(date+"T00:00:00Z");
 if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date)return null;
 const hour=Number(value.slice(8,10)),minute=Number(value.slice(10,12)),second=Number(value.slice(12,14));
 if(hour>23||minute>59||second>59)return null;
 return date+" "+value.slice(8,10)+":"+value.slice(10,12)+":"+value.slice(12,14);
}
export function normalizeKkrbSource(raw:unknown,now:Date):SourceSnapshot{
 if(!raw||typeof raw!=="object")throw new Error("KKRB 未返回密码数据");
 const data=raw as Record<string,unknown>;
 if(data.code!==1)throw new Error("KKRB 暂时无法获取，稍后自动重试");
 if(!data.data||typeof data.data!=="object"||Array.isArray(data.data))throw new Error("KKRB 数据格式不完整");
 const values=data.data as Record<string,unknown>;
 if(!KKR_MAPS.some(m=>values[m.key]&&typeof values[m.key]==="object"))throw new Error("KKRB 未返回地图记录");
 const entries:SourceRecord[]=KKR_MAPS.filter(m=>m.door==="main"||values[m.key]).map(map=>{
  const value=values[map.key] as Record<string,unknown>|undefined;
  const code=typeof value?.password==="string"?value.password.trim():null;
  const updatedAt=kkrUpdated(value?.updated);
  return {mapId:map.mapId,door:map.door,code:code&&(map.door==="siege"?/^\d{3}$/:/^\d{4}$/).test(code)?code:null,
   location:"",updatedAt,olderRecord:!!updatedAt&&updatedAt.slice(0,10)<chinaDate(now)};
 });
 // "updated" is a data-update time, not an expiry or effective date. Older records
 // remain explicitly unverified rather than being silently declared valid/invalid.
 return {...SOURCES[0],fetchedAt:now.toISOString(),sourceDate:null,region:null,
  status:entries.some(x=>x.code)?"ready":"pending",error:null,entries};
}
export function mergeSources(input:SourceSnapshot[],now:Date):PasswordData{
 const sources=input.map(s=>{
  if(s.fetchedAt&&!isCurrent(s.fetchedAt,now))return sourceFailure(s.id,"来源抓取记录已跨日，等待更新");
  if(s.sourceDate&&s.sourceDate!==chinaDate(now))return sourceFailure(s.id,"来源适用日期已过期");
  return s;
 });
 const entries:PasswordEntry[]=MAPS.map(map=>{
  const records=sources.flatMap(source=>source.entries.filter(r=>r.mapId===map.id).map(record=>({source,record})));
  const doorIds:DoorId[]=["main"];
  if(records.some(x=>x.record.door==="siege"))doorIds.push("siege");
  const doors:PasswordDoor[]=doorIds.map(door=>{
   const candidates:Candidate[]=[];
   for(const {source,record} of records){
    if(record.door!==door||!record.code||source.status!=="ready")continue;
    let candidate=candidates.find(c=>c.code===record.code);
    if(!candidate){candidate={code:record.code,sources:[],locations:[],updates:[],needsVerification:false};candidates.push(candidate)}
    if(!candidate.sources.includes(source.id))candidate.sources.push(source.id);
    const location=record.location.replace(/\s+/g," ").trim();
    if(location&&!candidate.locations.includes(location))candidate.locations.push(location);
    if(record.updatedAt&&!candidate.updates.some(u=>u.source===source.id&&u.at===record.updatedAt)){
     candidate.updates.push({source:source.id,at:record.updatedAt,olderRecord:record.olderRecord});
    }
    candidate.needsVerification ||= record.olderRecord;
   }
   return {id:door,label:door==="siege"?"彩六联动房 · 三位密码":"常规密码门",candidates,
    status:candidates.length>1?"conflict":candidates.length?"ready":"pending"};
  });
  const main=doors[0].candidates;
  return {...map,doors,code:main.length===1?main[0].code:null,location:main.flatMap(c=>c.locations).filter((x,i,a)=>a.indexOf(x)===i).join("；")};
 });
 const any=entries.some(e=>e.doors.some(d=>d.candidates.length));
 const errors=sources.filter(s=>s.status==="error");
 return {schemaVersion:2,entries,sources,fetchedAt:sources.some(s=>s.fetchedAt)?now.toISOString():null,
  sourceDate:null,region:null,status:any?"ready":errors.length>0&&errors.length===sources.length?"error":"pending",
  error:errors.length?(any?"部分来源暂不可用，已保留其他来源的本次数据":"今日密码待更新，稍后自动重试"):null,nextUpdateAt:nextUpdate(now)};
}
export function currentSnapshot(snapshot:PasswordData|null,now:Date):PasswordData{
 if(!snapshot||snapshot.schemaVersion!==2||!Array.isArray(snapshot.sources))return waiting(now,snapshot?.error??null);
 if(!snapshot.fetchedAt)return mergeSources(snapshot.sources,now);
 if(!isCurrent(snapshot.fetchedAt,now))return waiting(now,snapshot.error);
 // Rebuild from each independently timestamped source so a fresh aggregate cannot
 // make an old source or stale candidate look current.
 const merged=mergeSources(snapshot.sources,now);
 return {...merged,fetchedAt:merged.fetchedAt?snapshot.fetchedAt:null};
}
