"use client";
import {useEffect,useRef,useState} from "react";
import {Music2,Volume2,Power,Keyboard,Square} from "lucide-react";
import {Slider} from "@/components/ui/slider";
import {HarmonicaEngine} from "@/lib/harmonica-engine";
const rows=[{label:"高音区",range:"C5 – B5",octave:5,letters:["Q","W","E","R","T","Y","U"]},{label:"中央音区",range:"C4 – B4",octave:4,letters:["A","S","D","F","G","H","J"]},{label:"低音区",range:"C3 – B3",octave:3,letters:["Z","X","C","V","B","N","M"]}];
const intervals=[0,2,4,5,7,9,11];const names=["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"];
function noteName(midi:number){return names[midi%12]+(Math.floor(midi/12)-1)}
export function HarmonicaSection(){
 const engine=useRef<HarmonicaEngine|null>(null);const activeRef=useRef(false);const section=useRef<HTMLElement>(null);
 const [active,setActive]=useState(false),[held,setHeld]=useState<Record<string,number>>({}),[shift,setShift]=useState(false),[volume,setVolume]=useState(60),[error,setError]=useState<string|null>(null);
 const ensure=()=>{if(!engine.current)engine.current=new HarmonicaEngine();return engine.current};
 const clear=()=>{engine.current?.stopAll();setHeld({});setShift(false)};
 const stop=()=>{activeRef.current=false;setActive(false);clear()};
 const press=(id:string,midi:number)=>{if(!activeRef.current)return;setError(null);setHeld(previous=>({...previous,[id]:midi}));void ensure().press(id,midi).catch(()=>{setError("声音未能启用，请再次点击开始演奏。");stop()})};
 const release=(id:string)=>{engine.current?.release(id);setHeld(previous=>{const next={...previous};delete next[id];return next})};
 useEffect(()=>{
 const keyDown=(event:KeyboardEvent)=>{if(event.code==="Escape"){if(activeRef.current)stop();return}if(!activeRef.current||event.ctrlKey||event.metaKey||event.altKey)return;const target=event.target as HTMLElement;if(target.matches("input,textarea,select")||target.isContentEditable)return;if(event.code==="Tab"){event.preventDefault();if(!event.repeat){ensure().retune(1);setShift(true)}return}if(event.repeat)return;for(const row of rows){const i=row.letters.findIndex(letter=>"Key"+letter===event.code);if(i>=0){event.preventDefault();press(event.code,12*(row.octave+1)+intervals[i]);return}}};
 const keyUp=(event:KeyboardEvent)=>{if(event.code==="Tab"){engine.current?.retune(0);setShift(false)}release(event.code)};
 const blur=()=>clear();const visibility=()=>{if(document.hidden)clear()};
 document.addEventListener("keydown",keyDown);document.addEventListener("keyup",keyUp);window.addEventListener("blur",blur);window.addEventListener("pagehide",blur);document.addEventListener("visibilitychange",visibility);
 const observer=new IntersectionObserver(([entry])=>{if(!entry.isIntersecting)stop()},{threshold:0});if(section.current)observer.observe(section.current);
 return()=>{document.removeEventListener("keydown",keyDown);document.removeEventListener("keyup",keyUp);window.removeEventListener("blur",blur);window.removeEventListener("pagehide",blur);document.removeEventListener("visibilitychange",visibility);observer.disconnect();engine.current?.close()}
 },[]);
 const start=async()=>{try{await ensure().activate();activeRef.current=true;setActive(true);setError(null)}catch{setError("浏览器暂时无法启用声音，请再次尝试。")}};
 const values=Object.values(held);const last=values.at(-1);const display=last===undefined?"—":noteName(last+(shift?1:0));
 return <section id="harmonica" ref={section} className="harmonica-section section-shell"><div className="section-label"><span>05 / 战场之外</span><span>TAKE A BREATH</span></div><div className="section-heading"><div><p className="eyebrow">放下装备，让旋律响起</p><h2>行动之间，<span>奏一段自由</span></h2></div><p>全音区键盘口琴<br/><small>三个音区 · 自由演奏</small></p></div>
 <div className={"instrument "+(active?"instrument-active":"")}><div className="instrument-top"><div className="instrument-brand"><Music2 size={25}/><div><b>G.T.I. HARMONICA</b><span>C3 — B5 · 全音区键盘</span></div></div><span className="instrument-state">{active?"演奏已启用":"点击开始演奏"}</span><div className="volume-control"><Volume2 size={19}/><Slider value={[volume]} onValueChange={value=>{setVolume(value[0]);ensure().setVolume(value[0])}} min={0} max={100} step={1} aria-label="口琴音量"/><span>{volume}%</span></div></div>
 <div className="instrument-readout"><div><span>LIVE NOTE / 当前音符</span><b aria-live="off" data-testid="current-note">{display}</b><p>{error??(active?"按住字母键发声，松开停止；可同时按下多个键。":"点击开始演奏，使用下方对应的电脑键位。")}</p></div><div className="signal-bars" aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} className={values.length?"playing":""} style={{animationDelay:(i%7)*.07+"s",height:18+(i*23%57)+"px"}}/>)}</div><div className={"semitone "+(shift?"on":"")}><kbd>Tab</kbd><span>按住升半音</span></div></div>
 <div className="instrument-keyboard">{rows.map(row=><div className="note-row" key={row.label}><div className="note-row-label"><b>{row.label}</b><span>{row.range}</span></div>{row.letters.map((letter,i)=>{const midi=12*(row.octave+1)+intervals[i];const down=values.includes(midi);return <button key={letter} className={"note-key "+(down?"pressed":"")} disabled={!active} aria-label={letter+"键 "+noteName(midi)} aria-pressed={down} onPointerDown={event=>{event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);press("pointer"+event.pointerId,midi)}} onPointerUp={event=>release("pointer"+event.pointerId)} onPointerCancel={event=>release("pointer"+event.pointerId)} onLostPointerCapture={event=>release("pointer"+event.pointerId)} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();if(!event.repeat)press("button"+letter,midi)}}} onKeyUp={event=>{if(event.key==="Enter"||event.key===" ")release("button"+letter)}} onBlur={()=>release("button"+letter)}><span className="key-note">{noteName(midi+(shift?1:0))}</span><b>{letter}</b><span className="key-number">{i+1}</span></button>})}</div>)}</div>
 <div className="instrument-bottom"><span><Keyboard size={16}/>使用物理键位，建议切换英文输入法 · Esc 停止并退出演奏</span><button onClick={()=>active?stop():void start()} className={active?"stop-playing":"start-playing"}>{active?<Square size={17}/>:<Power size={17}/>} {active?"退出演奏":"开始演奏"}</button></div></div></section>;
}