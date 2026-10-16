'use strict';
(()=>{
const id='trust-nothing',notify=(type,data)=>{if(parent!==window)parent.postMessage({type,id,...data},location.origin==='null'?'*':location.origin)};
const note=document.querySelector('#notes'),old=note.oninput;note.oninput=()=>{old?.();try{localStorage.setItem('atlas:notes:'+id,note.value)}catch{}notify('atlas:notes',{text:note.value})};
let ticking=false;function send(){const total=document.documentElement.scrollHeight-innerHeight,percent=total>0?Math.max(0,Math.min(100,scrollY/total*100)):0;try{const previous=JSON.parse(localStorage.getItem('atlas:position:'+id));if(percent>1||!previous?.percent)localStorage.setItem('atlas:position:'+id,JSON.stringify({percent}))}catch{}notify('atlas:progress',{percent});ticking=false}addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(send)}},{passive:true});
addEventListener('message',e=>{if(e.source!==parent||parent===window||e.data?.id!==id)return;if(location.origin!=='null'&&e.origin!==location.origin)return;if(['atlas:restore','atlas:notes-update'].includes(e.data.type)&&typeof e.data.text==='string'&&document.activeElement!==note){note.value=e.data.text;try{localStorage.setItem('trust-nothing-notes',note.value)}catch{}}});
if(new URLSearchParams(location.search).get('resume')==='1'&&!location.hash){try{const p=JSON.parse(localStorage.getItem('atlas:position:'+id));if(p?.percent>0)setTimeout(()=>scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*p.percent/100),80)}catch{}}
notify('atlas:ready',{text:note.value});
})();
