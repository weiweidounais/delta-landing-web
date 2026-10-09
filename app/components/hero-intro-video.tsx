"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {Volume2,VolumeX} from "lucide-react";
import {sitePath} from "@/lib/site-paths";
import {HERO_INTRO_EVENT} from "@/lib/hero-scroll";
import styles from "./hero-clearance.module.css";

const time=(seconds:number)=>`${Math.floor(seconds/60).toString().padStart(2,"0")}:${Math.floor(seconds%60).toString().padStart(2,"0")}`;
type IntroPhase="locked"|"scanning"|"playing";
export function HeroIntroVideo(){
 const videoRef=useRef<HTMLVideoElement>(null),layerRef=useRef<HTMLDivElement>(null),manuallyPaused=useRef(false);
 const phaseRef=useRef<IntroPhase>("locked"),scanTimer=useRef<number|null>(null);
 const [phase,setPhase]=useState<IntroPhase>("locked");
 const [current,setCurrent]=useState(0),[duration,setDuration]=useState(15.4);
 const [paused,setPaused]=useState(true),[muted,setMuted]=useState(false),[blocked,setBlocked]=useState(false),[complete,setComplete]=useState(false);
 const finish=useCallback(()=>{
  const hero=layerRef.current?.closest<HTMLElement>(".hero");
  if(!hero||hero.dataset.introState==="complete")return;
  hero.dataset.introState="complete";
  hero.dispatchEvent(new Event(HERO_INTRO_EVENT));
 },[]);
 const playVideo=useCallback(()=>{
  const video=videoRef.current,hero=layerRef.current?.closest<HTMLElement>(".hero");
  if(!video||!hero||hero.dataset.introState==="complete"||document.hidden||manuallyPaused.current||phaseRef.current==="locked")return;
  video.play().catch(()=>{if(hero.dataset.introState!=="complete"){setBlocked(true);setPaused(true)}});
 },[]);
 useEffect(()=>{
  const video=videoRef.current,layer=layerRef.current,hero=layer?.closest<HTMLElement>(".hero");
  if(!video||!layer||!hero)return;
  const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
  const cancelScan=()=>{if(scanTimer.current!==null){window.clearTimeout(scanTimer.current);scanTimer.current=null}};
  const completed=()=>{
   if(hero.dataset.introState!=="complete")return;
   cancelScan();video.pause();layer.inert=true;setComplete(true);
  };
  const ready=()=>{if(Number.isFinite(video.duration)&&video.duration>0)setDuration(video.duration)};
  const playing=()=>{setPaused(false);setBlocked(false)};
  const pause=()=>setPaused(true);
  const progress=()=>setCurrent(video.currentTime);
  const volume=()=>setMuted(video.muted);
  const visibility=()=>{if(document.hidden)video.pause();else playVideo()};
  const preference=()=>{if(motion.matches)finish()};
  hero.addEventListener(HERO_INTRO_EVENT,completed);
  video.addEventListener("loadedmetadata",ready);video.addEventListener("timeupdate",progress);
  video.addEventListener("play",playing);video.addEventListener("pause",pause);video.addEventListener("volumechange",volume);
  video.addEventListener("ended",finish);video.addEventListener("error",finish);
  document.addEventListener("visibilitychange",visibility);motion.addEventListener("change",preference);
  ready();
  if(hero.dataset.introState==="complete")completed();
  else if(video.error||motion.matches||(location.hash&&location.hash!=="#home")||window.scrollY>window.innerHeight)finish();
  return()=>{
   cancelScan();video.pause();hero.removeEventListener(HERO_INTRO_EVENT,completed);
   video.removeEventListener("loadedmetadata",ready);video.removeEventListener("timeupdate",progress);
   video.removeEventListener("play",playing);video.removeEventListener("pause",pause);video.removeEventListener("volumechange",volume);
   video.removeEventListener("ended",finish);video.removeEventListener("error",finish);
   document.removeEventListener("visibilitychange",visibility);motion.removeEventListener("change",preference);
  };
 },[finish,playVideo]);
 useEffect(()=>{
  if(complete||phase==="playing")return;
  const html=document.documentElement,previousOverflow=html.style.overflow;
  html.style.overflow="hidden";
  return()=>{html.style.overflow=previousOverflow};
 },[phase,complete]);
 const deploy=()=>{
  if(phaseRef.current!=="locked")return;
  phaseRef.current="scanning";setPhase("scanning");
  const video=videoRef.current;
  if(video){video.muted=false;video.volume=1;setMuted(false)}
  manuallyPaused.current=false;
  // Start sound directly in the deployment click; the scan reveals the playing video.
  playVideo();
  scanTimer.current=window.setTimeout(()=>{
   scanTimer.current=null;
   if(layerRef.current?.closest<HTMLElement>(".hero")?.dataset.introState==="complete")return;
   phaseRef.current="playing";setPhase("playing");
  },950);
 };
 const toggle=()=>{
  const video=videoRef.current;if(!video)return;
  if(video.paused){manuallyPaused.current=false;playVideo()}
  else{manuallyPaused.current=true;video.pause()}
 };
 const toggleSound=()=>{const video=videoRef.current;if(video){video.muted=!video.muted;setMuted(video.muted)}};
 return <div ref={layerRef} className="hero-video-layer" data-phase={phase} aria-hidden={complete}>
  <video ref={videoRef} className="hero-video" src={sitePath("/videos/hero-intro.mp4?v=clearance-audio")} poster={sitePath("/assets/hero-video-poster.jpg")} playsInline preload="auto" aria-label="三角洲行动开场视频"/>
  <img className="intro-video-brand" src={sitePath("/assets/logo.png")} alt="三角洲行动"/>
  <div className={styles.clearance} data-phase={phase} aria-hidden={phase==="playing"||complete} inert={phase==="playing"||complete}>
   <div className={styles.hudGrid} aria-hidden="true"/>
   <div className={styles.hudTop}><span>G.T.I. / 战术部署</span><span><i/> {phase==="scanning"?"授权确认":"等待授权"}</span></div>
   <div className={styles.panel}>
    <span className={styles.frameCorner} aria-hidden="true"/>
    <p className={styles.eyebrow}>任务授权解锁</p>
    <div className={styles.typewriter}><p>G.T.I. CLEARANCE · OPERATOR 12</p><i aria-hidden="true"/></div>
    <p className={styles.prompt}>{phase==="scanning"?"身份验证完成 · 准备部署":"确认部署，进入行动现场"}</p>
    <button className={styles.deploy} onClick={deploy} disabled={phase!=="locked"}><span>{phase==="scanning"?"正在部署":"确认部署"}</span><i aria-hidden="true"/></button>
   </div>
   <div className={styles.hudBottom}><span>OPERATOR / 12</span><span>开场影像与音效将在部署后播放</span></div>
  </div>
  <div className={styles.scan} data-active={phase==="scanning"} aria-hidden="true"/>
  <div className="hero-video-controls" aria-hidden={phase!=="playing"} inert={phase!=="playing"}>
   <div className="hero-video-control-label"><span>开场影像 <small>{blocked?"点击播放继续开场":"部署已确认 · 结束后进入首屏"}</small></span><span className="hero-video-time">{time(current)} <i>/</i> {time(duration)}</span><div className="hero-video-buttons"><button className="hero-video-sound" onClick={toggleSound} aria-label={muted?"开启开场声音":"关闭开场声音"}>{muted?<VolumeX aria-hidden="true" size={18}/>:<Volume2 aria-hidden="true" size={18}/>}</button><button onClick={toggle} aria-label={paused?"播放开场视频":"暂停开场视频"}>{paused?"播放":"暂停"}</button><button onClick={finish}>跳过开场</button></div></div>
   <div className="hero-video-progress" role="progressbar" aria-label="开场视频播放进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(current/duration*100)}><span style={{width:`${Math.min(100,current/duration*100)}%`}}/></div>
  </div>
 </div>;
}
