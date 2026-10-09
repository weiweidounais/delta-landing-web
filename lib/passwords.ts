import {env} from "cloudflare:workers";
import {chinaHour,currentSnapshot,mergeSources,waiting,type PasswordData} from "./password-model";
import {fetchDeltaPasswords,fetchKkrbPasswords} from "./password-sources";
type Stored={payload:string;attempted_at:number;updated_at:number};
function database(){if(!env.DB)throw new Error("密码存储暂不可用");return env.DB}
export async function readPasswords():Promise<PasswordData>{
 const now=new Date();const db=database();
 const stored=await db.prepare("SELECT payload, attempted_at, updated_at FROM password_snapshots WHERE id = ?").bind("daily").first<Stored>();
 let previous:PasswordData|null=null;
 if(stored){try{previous=JSON.parse(stored.payload)}catch{previous=null}}
 const current=currentSnapshot(previous,now);
 const compatible=previous?.schemaVersion===2;
 const eligible=chinaHour(now)>=2;
 const due=!stored||now.getTime()-stored.attempted_at>=5*60000;
 if(!eligible||(compatible&&!due))return current;
 const claim=await db.prepare("INSERT INTO password_snapshots (id, payload, attempted_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET attempted_at = excluded.attempted_at, payload = excluded.payload WHERE password_snapshots.attempted_at < ? OR json_extract(password_snapshots.payload, '$.schemaVersion') IS NOT 2")
  .bind("daily",JSON.stringify(current),now.getTime(),now.getTime(),now.getTime()-5*60000).run();
 if(!claim.meta.changes)return current;
 let result:PasswordData;
 try{
  // Sources are independent: one failure must not erase another source's fresh records.
  const sources=await Promise.all([fetchKkrbPasswords(now),fetchDeltaPasswords(now)]);
  result=mergeSources(sources,new Date());
 }catch(error){
  console.error("Daily passwords refresh failed",error instanceof Error?error.message:"Unknown error");
  result=waiting(new Date(),"今日密码待更新，稍后自动重试");
 }
 await db.prepare("UPDATE password_snapshots SET payload = ?, updated_at = ? WHERE id = ? AND attempted_at = ?")
  .bind(JSON.stringify(result),Date.now(),"daily",now.getTime()).run();
 return result;
}
