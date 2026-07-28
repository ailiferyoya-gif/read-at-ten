(function(){
"use strict";
const P=window.parent!==window?window.parent:window,S=P.CASE_STATE||window.CASE_STATE,clean=v=>String(v||"vdm://home").trim().replace(/[<>"']/g,"");
function snapshot(){const b=S&&S.get?S.get().browser:{history:[],cursor:-1};return {history:(b.history||[]).slice(),cursor:Number.isInteger(b.cursor)?b.cursor:-1,sessionId:b.sessionId||null};}
function store(next,reason){if(S&&S.update)S.update("browser",next,reason||"browser-route");}
function notify(entry,cursor){P.VDM_BUS&&P.VDM_BUS.emit("route:changed",{route:entry.url,entry,cursor});}
function entry(route,meta){const url=clean(route),hash=url.indexOf("#"),query=url.indexOf("?");return {url,query:query>=0?url.slice(query+1,hash>=0?hash:undefined):"",fragment:hash>=0?url.slice(hash+1):"",version:meta&&meta.version||null,sessionId:meta&&meta.sessionId||("b"+Date.now()),at:Date.now(),source:meta&&meta.source||"browser"};}
window.VDM_ROUTE={resolve:clean,push(route,meta){const s=snapshot(),e=entry(route,meta),h=s.history.slice(0,s.cursor+1);h.push(e);store({history:h,cursor:h.length-1,sessionId:e.sessionId},"browser-push");notify(e,h.length-1);return e.url;},replace(route,meta){const s=snapshot(),e=entry(route,meta),h=s.history.slice();if(s.cursor<0)h.push(e);else h[s.cursor]=e;const c=Math.max(0,s.cursor);store({history:h,cursor:c,sessionId:e.sessionId},"browser-replace");notify(e,c);return e.url;},back(){const s=snapshot(),c=Math.max(0,s.cursor-1),e=s.history[c]||entry("vdm://home");store({cursor:c},"browser-back");notify(e,c);return e.url;},forward(){const s=snapshot(),c=Math.min(s.history.length-1,s.cursor+1),e=s.history[c]||entry("vdm://home");store({cursor:c},"browser-forward");notify(e,c);return e.url;},reload(){const s=snapshot(),e=s.history[s.cursor]||entry("vdm://home");notify(e,s.cursor);return e.url;},current(){const s=snapshot();return s.history[s.cursor]?.url||"vdm://home";},currentEntry(){const s=snapshot();return s.history[s.cursor]||entry("vdm://home");},snapshot};
})();

