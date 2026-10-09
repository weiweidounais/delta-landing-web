import {readPasswords} from "@/lib/passwords";
import {waiting} from "@/lib/password-model";
export const dynamic="force-dynamic";
export async function GET(){try{return Response.json(await readPasswords(),{headers:{"Cache-Control":"no-store"}})}catch(error){console.error("Password storage unavailable",error);return Response.json(waiting(new Date(),"今日密码待更新，稍后自动重试"),{status:503,headers:{"Cache-Control":"no-store"}})}}