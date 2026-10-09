export const HERO_PROGRESS_EVENT = "delta-hero-progress";
export const VIDEO_SCROLL_SVH = 190;
export const HANDOFF_SCROLL_SVH = 25;
export const ZOOM_SCROLL_SVH = 90;
export const HERO_EXTRA_SVH = VIDEO_SCROLL_SVH + HANDOFF_SCROLL_SVH + ZOOM_SCROLL_SVH;

export type HeroProgress = {
 videoProgress:number;videoVisible:number;videoDistance:number;handoffDistance:number;zoomProgress:number;
};
const clamp=(value:number)=>Math.max(0,Math.min(1,value));
export function heroProgress(scroll:number,distance:number,videoActive:boolean):HeroProgress{
 const videoDistance=videoActive?distance*VIDEO_SCROLL_SVH/HERO_EXTRA_SVH:0;
 const handoffDistance=videoActive?distance*HANDOFF_SCROLL_SVH/HERO_EXTRA_SVH:0;
 const handoff=videoActive?clamp((scroll-videoDistance)/Math.max(1,handoffDistance)):1;
 return {
  videoProgress:videoActive?clamp(scroll/Math.max(1,videoDistance)):1,
  videoVisible:1-handoff*handoff*(3-2*handoff),videoDistance,handoffDistance,
  zoomProgress:clamp((scroll-videoDistance-handoffDistance)/Math.max(1,distance-videoDistance-handoffDistance))
 };
}
