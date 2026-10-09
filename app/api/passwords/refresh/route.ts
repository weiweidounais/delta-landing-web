import {readPasswords} from "@/lib/passwords";
import {waiting} from "@/lib/password-model";
export const dynamic="force-dynamic";
// The published Site is owner-private. The Sites dispatcher authenticates visitors
// and service access before reaching this shared, idempotent updater.
export async function POST(request:Request){
 const origin=request.headers.get("Origin");
 if(origin&&origin!==new URL(request.url).origin)return Response.json({error:"Invalid request origin"},{status:403});
 try{return Response.json(await readPasswords(),{headers:{"Cache-Control":"no-store"}})}catch(error){console.error("Scheduled password refresh failed",error);return Response.json(waiting(new Date(),"今日密码待更新，稍后自动重试"),{status:503})}
}