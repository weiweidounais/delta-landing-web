"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {sitePath} from "@/lib/site-paths";
import {HERO_INTRO_EVENT} from "@/lib/hero-scroll";

const time=(seconds:number)=>`${Math.floor(seconds/60).toString().padStart(2,"0")}:${Math.floor(seconds%60).toString().padStart(2,"0")}`;
export function HeroIntroVideo(){
 const videoRef=useRef<HTMLVideoElement>(null),layerRef=useRef<HTMLDivElement>(null),manuallyPaused=useRef(false);
 const [current,setCurrent]=useState(0),[duration,setDuration]=useState(15.4);
 const [paused,setPaused]=useState(false),[blocked,setBlocked]=useState(false),[complete,setComplete]=useState(false);
 const finish=useCallback(()=>{
  const hero=layerRef.current?.closest<HTMLElement>(".hero");
  if(!hero||hero.dataset.introState==="complete")return;
  hero.dataset.introState="complete";
  hero.dispatchEvent(new Event(HERO_INTRO_EVENT));
 },[]);
 useEffect(()=>{
  const video=videoRef.current,layer=layerRef.current,hero=layer?.closest<HTMLElement>(".hero");
  if(!video||!layer||!hero)return;
  const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
  let disposed=false;
  const completed=()=>{
   if(hero.dataset.introState!=="complete")return;
   video.pause();layer.inert=true;setComplete(true);
  };
  const play=()=>{
   if(disposed||hero.dataset.introState==="complete"||document.hidden||manuallyPaused.current)return;
   video.muted=true;
   video.play().catch(()=>{if(!disposed&&hero.dataset.introState!=="complete"){setBlocked(true);setPaused(true)}});
  };
  const ready=()=>{if(Number.isFinite(video.duration)&&video.duration>0)setDuration(video.duration)};
  const playing=()=>{setPaused(false);setBlocked(false)};
  const pause=()=>setPaused(true);
  const progress=()=>setCurrent(video.currentTime);
  const visibility=()=>{if(document.hidden)video.pause();else play()};
  const preference=()=>{if(motion.matches)finish()};
  hero.addEventListener(HERO_INTRO_EVENT,completed);
  video.addEventListener("loadedmetadata",ready);video.addEventListener("timeupdate",progress);
  video.addEventListener("play",playing);video.addEventListener("pause",pause);
  video.addEventListener("ended",finish);video.addEventListener("error",finish);
  document.addEventListener("visibilitychange",visibility);motion.addEventListener("change",preference);
  if(video.error||motion.matches||(location.hash&&location.hash!=="#home")||window.scrollY>window.innerHeight)finish();
  else if(hero.dataset.introState==="complete")completed();
  else{ready();play()}
  return()=>{
   disposed=true;video.pause();hero.removeEventListener(HERO_INTRO_EVENT,completed);
   video.removeEventListener("loadedmetadata",ready);video.removeEventListener("timeupdate",progress);
   video.removeEventListener("play",playing);video.removeEventListener("pause",pause);
   video.removeEventListener("ended",finish);video.removeEventListener("error",finish);
   document.removeEventListener("visibilitychange",visibility);motion.removeEventListener("change",preference);
  };
 },[finish]);
 const toggle=()=>{
  const video=videoRef.current;if(!video)return;
  if(video.paused){manuallyPaused.current=false;video.play().catch(()=>setBlocked(true))}
  else{manuallyPaused.current=true;video.pause()}
 };
 return <div ref={layerRef} className="hero-video-layer" aria-hidden={complete}>
  <video ref={videoRef} className="hero-video" src={sitePath("/videos/hero-intro.mp4")} poster={sitePath("/assets/hero-video-poster.jpg")} autoPlay muted playsInline preload="auto" aria-label="自动播放的三角洲行动开场视频"/>
  <img className="intro-video-brand" src={sitePath("/assets/logo.png")} alt="三角洲行动"/>
  <div className="hero-video-controls">
   <div className="hero-video-control-label"><span>开场影像 <small>{blocked?"点击播放，或跳过进入首屏":"自动播放 · 结束后进入首屏"}</small></span><span className="hero-video-time">{time(current)} <i>/</i> {time(duration)}</span><button onClick={toggle} aria-label={paused?"播放开场视频":"暂停开场视频"}>{paused?"播放":"暂停"}</button><button onClick={finish}>跳过开场</button></div>
   <div className="hero-video-progress" role="progressbar" aria-label="开场视频播放进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(current/duration*100)}><span style={{width:`${Math.min(100,current/duration*100)}%`}}/></div>
  </div>
 </div>;
}
