"use client";
import {useEffect,useRef,type ReactNode} from "react";
import {heroProgress,HERO_PROGRESS_EVENT,HERO_EXTRA_SVH,ZOOM_SCROLL_SVH} from "@/lib/hero-scroll";
const clamp=(value:number)=>Math.max(0,Math.min(1,value));
export function ScrollExperience({children}:{children:ReactNode}){
 const root=useRef<HTMLElement>(null);
 useEffect(()=>{
  const main=root.current;if(!main)return;
  const hero=main.querySelector<HTMLElement>(".hero");
  const scene=main.querySelector<HTMLElement>(".hero-scene");
  const videoLayer=main.querySelector<HTMLElement>(".hero-video-layer");
  const overviewVideo=main.querySelector<HTMLVideoElement>(".about-video-screen video");
  const afterOverview=main.querySelector<HTMLElement>("#about")?.nextElementSibling;
  const header=main.querySelector<HTMLElement>(".site-header");
  const cards=Array.from(main.querySelectorAll<HTMLElement>(":scope > .section-shell"));
  const intro=Array.from(main.querySelectorAll<HTMLElement>(".hero-title,.hero-copy,.hero-footer,.hero-grid"));
  const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame=0,distance=1,headerHeight=82;
  const update=()=>{
   frame=0;
   const videoActive=!!videoLayer&&hero?.dataset.videoFailed!=="true"&&!motion.matches;
   const timeline=heroProgress(window.scrollY,distance,videoActive);
   const progress=motion.matches?1:timeline.zoomProgress;
   main.style.setProperty("--hero-video-visible",String(timeline.videoVisible));
   if(videoLayer){videoLayer.inert=timeline.videoVisible<.05;videoLayer.setAttribute("aria-hidden",String(timeline.videoVisible<.05))}
   hero?.dispatchEvent(new CustomEvent(HERO_PROGRESS_EVENT,{detail:timeline}));
   const reveal=clamp((progress-.25)/.55);
   const eased=reveal*reveal*(3-2*reveal);
   main.style.setProperty("--intro-reveal",String(eased));
   main.style.setProperty("--hero-zoom",String(1.3-.3*progress));
   main.style.setProperty("--intro-shift",String((1-eased)*28)+"px");
   if(header){header.dataset.introVisible=String(eased>.05);header.inert=eased<=.05}
   intro.forEach(element=>{element.inert=eased<=.05});
   const layers=[hero,...cards].filter((element):element is HTMLElement=>!!element);
   layers.forEach((element,index)=>{
    const next=layers[index+1];
    const cover=!motion.matches&&next?clamp((window.innerHeight-next.getBoundingClientRect().top)/(window.innerHeight-headerHeight-12)):0;
    element.style.setProperty("--card-dim",String(cover*.32));
   });
   if(overviewVideo&&!overviewVideo.paused&&!document.fullscreenElement&&document.pictureInPictureElement!==overviewVideo){
    const rect=overviewVideo.getBoundingClientRect();
    const visibleBottom=Math.min(window.innerHeight,afterOverview?.getBoundingClientRect().top??window.innerHeight);
    if(rect.bottom<=headerHeight||rect.top>=visibleBottom)overviewVideo.pause();
   }
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};
  const measure=()=>{
   headerHeight=header?.offsetHeight??82;
   hero?.style.setProperty("--hero-extra-distance",(videoLayer&&hero.dataset.videoFailed!=="true"?HERO_EXTRA_SVH:ZOOM_SCROLL_SVH)+"svh");
   distance=Math.max(1,(hero?.offsetHeight??0)-(scene?.offsetHeight??0));
   cards.forEach((card,index)=>{
    // A tall card scrolls to its bottom before it stays beneath the next card.
    card.style.setProperty("--stack-top",Math.min(headerHeight+12,window.innerHeight-card.offsetHeight-16)+"px");
    card.style.setProperty("--stack-order",String(index+2));
   });
   schedule();
  };
  const navigate=(hash:string,behavior:ScrollBehavior)=>{
   const target=Array.from(main.children).find(element=>"#"+element.id===hash) as HTMLElement|undefined;
   if(!target)return false;
   // Sticky positions change with scrolling; anchors need the original flow position.
   let top=main.offsetTop;
   for(const element of Array.from(main.children) as HTMLElement[]){
    if(element===target)break;
    const style=getComputedStyle(element);
    if(style.position==="fixed")continue;
    top+=element.offsetHeight+(parseFloat(style.marginTop)||0)+(parseFloat(style.marginBottom)||0);
   }
   window.scrollTo({top:Math.max(0,top-(target===hero?0:headerHeight)),behavior});
   schedule();return true;
  };
  const click=(event:MouseEvent)=>{
   if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
   const link=(event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
   const hash=link?.getAttribute("href");
   if(!hash||!navigate(hash,motion.matches?"instant":"smooth"))return;
   event.preventDefault();if(location.hash!==hash)history.pushState(null,"",hash);
  };
  const hashChange=()=>navigate(location.hash,"instant");
  const observer=new ResizeObserver(measure);
  cards.forEach(card=>observer.observe(card));
  if(hero)observer.observe(hero);
  if(header)observer.observe(header);
  window.addEventListener("scroll",schedule,{passive:true});
  window.addEventListener("resize",measure);
  main.addEventListener("click",click);
  window.addEventListener("hashchange",hashChange);
  motion.addEventListener("change",measure);
  measure();cancelAnimationFrame(frame);update();
  if(location.hash)navigate(location.hash,"instant");
  return()=>{observer.disconnect();cancelAnimationFrame(frame);window.removeEventListener("scroll",schedule);window.removeEventListener("resize",measure);main.removeEventListener("click",click);window.removeEventListener("hashchange",hashChange);motion.removeEventListener("change",measure)};
 },[]);
 return <main ref={root} className="scroll-experience">{children}</main>;
}
