export const MAPS=[{id:"zero-dam",name:"零号大坝"},{id:"layali-grove",name:"长弓溪谷"},{id:"brakkesh",name:"巴克什"},{id:"space-city",name:"航天基地"},{id:"tide-prison",name:"潮汐监狱"},{id:"az3",name:"AZ3"}];
export type PasswordEntry={id:string;name:string;code:string|null;location:string};
export type PasswordData={entries:PasswordEntry[];fetchedAt:string|null;sourceDate:string|null;region:string|null;status:"ready"|"pending"|"error";error:string|null;nextUpdateAt:string};
export function chinaDate(date:Date){return new Date(date.getTime()+8*3600000).toISOString().slice(0,10)}
export function chinaHour(date:Date){return new Date(date.getTime()+8*3600000).getUTCHours()}
export function nextUpdate(date:Date){const target=new Date(chinaDate(date)+"T02:00:00+08:00");if(target.getTime()<=date.getTime())target.setUTCDate(target.getUTCDate()+1);return target.toISOString()}
export function waiting(now:Date,error:string|null=null):PasswordData{return {entries:MAPS.map(m=>({...m,code:null,location:""})),fetchedAt:null,sourceDate:null,region:null,status:error?"error":"pending",error,nextUpdateAt:nextUpdate(now)}}
export function normalizeSource(raw:unknown,now:Date):PasswordData{
 if(!raw||typeof raw!=="object")throw new Error("来源未返回密码数据");
 const data=raw as Record<string,unknown>;
 if(!Array.isArray(data.entries))throw new Error("来源数据格式不完整");
 if(data.stale===true||data.error)throw new Error("来源数据过期或同步异常");
 if(typeof data.fetchedAt!=="string"||!Number.isFinite(Date.parse(data.fetchedAt)))throw new Error("来源缺少获取时间");
 const fetched=new Date(data.fetchedAt);
 if(chinaDate(fetched)!==chinaDate(now)||fetched.getTime()>now.getTime()+60000)throw new Error("来源未取得本日数据");
 const sourceDate=typeof data.sourceDate==="string"?data.sourceDate.slice(0,10):null;
 if(sourceDate&&sourceDate!==chinaDate(now))throw new Error("密码适用日期不是今天");
 const entries=MAPS.map(map=>{const value=(data.entries as Record<string,unknown>[]).find(x=>x&&x.id===map.id);return {...map,code:typeof value?.code==="string"&&/^\d{4}$/.test(value.code)?value.code:null,location:typeof value?.location==="string"?value.location.slice(0,300):""}});
 return {entries,fetchedAt:data.fetchedAt,sourceDate,region:typeof data.region==="string"?data.region:null,status:entries.some(x=>x.code)?"ready":"pending",error:null,nextUpdateAt:nextUpdate(now)};
}
export function currentSnapshot(snapshot:PasswordData|null,now:Date):PasswordData{
 if(!snapshot||!snapshot.fetchedAt||chinaDate(new Date(snapshot.fetchedAt))!==chinaDate(now))return waiting(now,snapshot?.error??null);
 if(snapshot.sourceDate&&snapshot.sourceDate!==chinaDate(now))return waiting(now,"来源适用日期已过期");
 return {...snapshot,nextUpdateAt:nextUpdate(now)};
}