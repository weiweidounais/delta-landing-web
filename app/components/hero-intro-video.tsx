"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {sitePath} from "@/lib/site-paths";
import {HERO_INTRO_EVENT} from "@/lib/hero-scroll";
import styles from "./hero-clearance.module.css";

type IntroPhase="locked"|"scanning"|"playing";
export function HeroIntroVideo(){
 const videoRef=useRef<HTMLVideoElement>(null),layerRef=useRef<HTMLDivElement>(null);
 const phaseRef=useRef<IntroPhase>("locked"),scanTimer=useRef<number|null>(null);
 const [phase,setPhase]=useState<IntroPhase>("locked");
 const [complete,setComplete]=useState(false);
 const finish=useCallback(()=>{
  const hero=layerRef.current?.closest<HTMLElement>(".hero");
  if(!hero||hero.dataset.introState==="complete")return;
  hero.dataset.introState="complete";
  hero.dispatchEvent(new Event(HERO_INTRO_EVENT));
 },[]);
 const playVideo=useCallback(()=>{
  const video=videoRef.current,hero=layerRef.current?.closest<HTMLElement>(".hero");
  if(!video||!hero||hero.dataset.introState==="complete"||document.hidden||phaseRef.current==="locked")return;
  video.play().catch(error=>{if(error?.name!=="AbortError"&&!document.hidden)finish()});
 },[finish]);
 useEffect(()=>{
  const video=videoRef.current,layer=layerRef.current,hero=layer?.closest<HTMLElement>(".hero");
  if(!video||!layer||!hero)return;
  const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
  const cancelScan=()=>{if(scanTimer.current!==null){window.clearTimeout(scanTimer.current);scanTimer.current=null}};
  const completed=()=>{
   if(hero.dataset.introState!=="complete")return;
   cancelScan();video.pause();layer.inert=true;setComplete(true);
  };
  const visibility=()=>{if(document.hidden)video.pause();else playVideo()};
  const preference=()=>{if(motion.matches)finish()};
  hero.addEventListener(HERO_INTRO_EVENT,completed);
  video.addEventListener("ended",finish);video.addEventListener("error",finish);
  document.addEventListener("visibilitychange",visibility);motion.addEventListener("change",preference);
  if(hero.dataset.introState==="complete")completed();
  else if(video.error||motion.matches||(location.hash&&location.hash!=="#home")||window.scrollY>window.innerHeight)finish();
  return()=>{
   cancelScan();video.pause();hero.removeEventListener(HERO_INTRO_EVENT,completed);
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
  if(video){video.muted=false;video.volume=1}
  // Start sound directly in the deployment click; the scan reveals the playing video.
  playVideo();
  scanTimer.current=window.setTimeout(()=>{
   scanTimer.current=null;
   if(layerRef.current?.closest<HTMLElement>(".hero")?.dataset.introState==="complete")return;
   phaseRef.current="playing";setPhase("playing");
  },950);
 };
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
   <button className="hero-video-skip" onClick={finish}>跳过开场</button>
  </div>
 </div>;
}
