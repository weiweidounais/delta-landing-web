import {env} from "cloudflare:workers";
import {chinaDate,chinaHour,currentSnapshot,normalizeSource,waiting,type PasswordData} from "./password-model";
const SOURCE="https://deltaforce.codes/api/codes";
type Stored={payload:string;attempted_at:number;updated_at:number};
function database(){if(!env.DB)throw new Error("密码存储暂不可用");return env.DB}
export async function readPasswords(force=false):Promise<PasswordData>{
 const now=new Date();const db=database();
 const stored=await db.prepare("SELECT payload, attempted_at, updated_at FROM password_snapshots WHERE id = ?").bind("daily").first<Stored>();
 let previous:PasswordData|null=null;
 if(stored){try{previous=JSON.parse(stored.payload)}catch{previous=null}}
 const current=currentSnapshot(previous,now);
 const complete=current.status==="ready"&&current.entries.every(x=>x.code);
 const eligible=chinaHour(now)>=2;
 const needsSync=eligible&&(!complete||force);
 if(!needsSync||stored&&now.getTime()-stored.attempted_at<5*60000)return current;
 // Claim a short durable lease so simultaneous visitors do not hammer the source.
 const claim=await db.prepare("INSERT INTO password_snapshots (id, payload, attempted_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET attempted_at = excluded.attempted_at WHERE password_snapshots.attempted_at < ?").bind("daily",JSON.stringify(current),now.getTime(),now.getTime(),now.getTime()-5*60000).run();
 if(!claim.meta.changes)return current;
 let result:PasswordData;
 try{
  const response=await fetch(SOURCE,{headers:{Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error("来源暂不可用");
  result=normalizeSource(await response.json(),now);
 }catch(error){
  console.error("Daily passwords refresh failed",error instanceof Error?error.message:"Unknown error");
  // Never publish the preceding day's codes, nor keep old codes after a failed refresh.
  result=waiting(now,"今日密码待更新，稍后自动重试");
 }
 await db.prepare("UPDATE password_snapshots SET payload = ?, updated_at = ? WHERE id = ? AND attempted_at = ?").bind(JSON.stringify(result),now.getTime(),"daily",now.getTime()).run();
 return result;
}