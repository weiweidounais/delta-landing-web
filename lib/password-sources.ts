import {normalizeDeltaSource,normalizeKkrbSource,sourceFailure,SOURCES,type SourceSnapshot} from "./password-model";
const KKR_ORIGIN="https://www.kkrb.net";
const KKR_PAGE=SOURCES[0].url;
const UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
export async function fetchDeltaPasswords(now:Date):Promise<SourceSnapshot>{
 try{
  const response=await fetch("https://deltaforce.codes/api/codes",{headers:{Accept:"application/json"},cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error("来源暂不可用");
  return normalizeDeltaSource(await response.json(),now);
 }catch(error){
  console.error("Delta Force Codes refresh failed",error instanceof Error?error.message:"Unknown error");
  return sourceFailure("deltaforce","暂时无法同步，稍后自动重试");
 }
}
export async function fetchKkrbPasswords(now:Date):Promise<SourceSnapshot>{
 // Reproduce the public page's anonymous session and its standard CSRF header.
 // Cookies exist only for this fetch, never in the saved result or browser bundle.
 const jar=new Map<string,string>();
 const signal=AbortSignal.timeout(20000);
 const remember=(response:Response)=>{
  const cookies=typeof response.headers.getSetCookie==="function"?response.headers.getSetCookie():[response.headers.get("set-cookie")??""];
  for(const header of cookies){
   for(const part of header.split(/,(?=\s*[^;,\s]+=)/)){
    const pair=part.split(";")[0].trim();const index=pair.indexOf("=");
    if(index>0)jar.set(pair.slice(0,index),pair.slice(index+1));
   }
  }
 };
 const request=async(path:string,body?:string)=>{
  const headers:Record<string,string>={"User-Agent":UA,Referer:KKR_PAGE,Accept:"application/json, text/javascript, */*; q=0.01"};
  if(jar.size)headers.Cookie=[...jar].map(([key,value])=>key+"="+value).join("; ");
  if(body!==undefined){
   headers["Content-Type"]="application/x-www-form-urlencoded; charset=UTF-8";
   headers["X-Requested-With"]="XMLHttpRequest";
   const csrf=jar.get("csrf_token");if(csrf)headers["X-CSRF-Token"]=decodeURIComponent(csrf);
  }
  const response=await fetch(path==="/"?KKR_PAGE:KKR_ORIGIN+path,{method:body===undefined?"GET":"POST",headers,body,redirect:"manual",cache:"no-store",signal});
  remember(response);
  if(!response.ok)throw new Error("KKRB 暂不可用");
  return response;
 };
 try{
  const page=await request("/");await page.body?.cancel();
  const menu=await request("/getMenu","globalData=false");
  const menuData=await menu.json() as {code?:number};
  if(menuData.code!==1||!jar.get("csrf_token"))throw new Error("KKRB 匿名会话暂不可用");
  const status=await request("/checkUAStatus","");
  const uaData=await status.json() as {code?:number};
  if(uaData.code!==1)throw new Error("KKRB 暂时无法访问");
  const response=await request("/getBonusDoorData","");
  return normalizeKkrbSource(await response.json(),now);
 }catch(error){
  console.error("KKRB refresh failed",error instanceof Error?error.message:"Unknown error");
  return sourceFailure("kkrb","暂时无法同步，稍后自动重试");
 }
}
