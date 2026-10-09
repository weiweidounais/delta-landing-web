"use client";
import {useRef,useState} from "react";
import {Play} from "lucide-react";
import {sitePath} from "@/lib/site-paths";
export function OverviewVideo(){
 const video=useRef<HTMLVideoElement>(null);
 const [playing,setPlaying]=useState(false),[started,setStarted]=useState(false),[error,setError]=useState(false);
 const play=()=>{setError(false);if(video.current?.error)video.current.load();video.current?.play().catch(()=>setError(true))};
 return <figure className="about-video-window">
  <div className="about-video-screen">
   <video ref={video} src={sitePath("/videos/firefight-introduction.mp4")} poster={sitePath("/assets/firefight-video-poster.jpg")} controls playsInline preload="none" width={864} height={486} aria-label="三角洲行动影像展示" onPlay={()=>{setPlaying(true);setStarted(true);setError(false)}} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)} onError={()=>setError(true)}/>
   {!playing&&<button className="about-video-play" onClick={play} aria-label={started?"继续播放三角洲行动视频":"播放三角洲行动视频"}><Play size={28} fill="currentColor"/><span>{started?"继续播放":"播放视频"}</span></button>}
  </div>
  <figcaption><span>三角洲行动 <b>影像展示</b></span><span>06:27</span></figcaption>
  {error&&<p className="video-play-error" role="status">视频暂时无法播放，请稍后重试。</p>}
 </figure>;
}
