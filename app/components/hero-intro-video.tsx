"use client";
import {useEffect,useRef,useState} from "react";
import {Slider} from "@/components/ui/slider";
import {sitePath} from "@/lib/site-paths";
import {HERO_PROGRESS_EVENT,type HeroProgress} from "@/lib/hero-scroll";

const time=(seconds:number)=>`${Math.floor(seconds/60).toString().padStart(2,"0")}:${Math.floor(seconds%60).toString().padStart(2,"0")}`;
export function HeroIntroVideo(){
 const videoRef=useRef<HTMLVideoElement>(null),layerRef=useRef<HTMLDivElement>(null);
 const timeline=useRef<HeroProgress|null>(null);
 const [progress,setProgress]=useState(0),[duration,setDuration]=useState(15.4);
 useEffect(()=>{
  const video=videoRef.current,hero=layerRef.current?.closest<HTMLElement>(".hero");
  if(!video||!hero)return;
  layerRef.current?.querySelector('[role="slider"]')?.setAttribute("aria-label","开场视频进度");
  let frame=0;
  const seek=()=>{
   frame=0;
   if(!Number.isFinite(video.duration)||video.duration<=0||video.readyState<1||video.seeking)return;
   const target=Math.min(video.duration-1/60,(timeline.current?.videoProgress??0)*video.duration);
   if(Math.abs(video.currentTime-target)>1/120)video.currentTime=Math.max(0,target);
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(seek)};
  const update=(event:Event)=>{
   const detail=(event as CustomEvent<HeroProgress>).detail;
   timeline.current=detail;setProgress(detail.videoProgress*100);schedule();
  };
  const ready=()=>{if(Number.isFinite(video.duration))setDuration(video.duration);video.pause();schedule()};
  const error=()=>{hero.dataset.videoFailed="true";window.dispatchEvent(new Event("resize"))};
  hero.addEventListener(HERO_PROGRESS_EVENT,update);
  video.addEventListener("loadedmetadata",ready);video.addEventListener("loadeddata",schedule);
  video.addEventListener("seeked",schedule);video.addEventListener("error",error);
  if(video.error)error();else if(video.readyState>=1)ready();
  return()=>{cancelAnimationFrame(frame);hero.removeEventListener(HERO_PROGRESS_EVENT,update);video.removeEventListener("loadedmetadata",ready);video.removeEventListener("loadeddata",schedule);video.removeEventListener("seeked",schedule);video.removeEventListener("error",error)};
 },[]);
 const move=(value:number[])=>{
  const distance=timeline.current?.videoDistance;if(!distance)return;
  window.scrollTo({top:distance*value[0]/100,behavior:"instant"});
 };
 const skip=()=>{
  const state=timeline.current;if(!state)return;
  window.scrollTo({top:state.videoDistance+state.handoffDistance,behavior:"instant"});
 };
 return <div ref={layerRef} className="hero-video-layer">
  <video ref={videoRef} className="hero-video" src={sitePath("/videos/hero-intro.mp4")} poster={sitePath("/assets/hero-video-poster.jpg")} muted playsInline preload="auto" aria-label="随滚动推进的三角洲行动开场视频"/>
  <img className="intro-video-brand" src={sitePath("/assets/logo.png")} alt="三角洲行动"/>
  <div className="hero-video-controls">
   <div className="hero-video-control-label"><span>滚动推进开场 <small>也可拖动进度条</small></span><span className="hero-video-time">{time(progress/100*duration)} <i>/</i> {time(duration)}</span><button onClick={skip}>跳过开场</button></div>
   <Slider className="hero-video-slider" value={[progress]} max={100} step={.1} onValueChange={move} aria-label="开场视频进度"/>
  </div>
 </div>;
}
