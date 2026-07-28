(function(global){
"use strict";
const nfkc=value=>String(value??"").normalize("NFKC").toLocaleLowerCase("ja");
const normalize=value=>nfkc(value).replace(/[\s\p{P}\p{S}ー―‐‑–—]+/gu,"");
const terms=value=>nfkc(value).split(/[\s\p{P}\p{S}]+/u).filter(Boolean);
const includesAll=(haystack,needle)=>{const h=normalize(haystack);return terms(needle).every(part=>h.includes(normalize(part)));};
const distance=(left,right)=>{const a=Array.from(normalize(left)),b=Array.from(normalize(right));if(!a.length)return b.length;if(!b.length)return a.length;let previous=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i+=1){const current=[i];for(let j=1;j<=b.length;j+=1){current[j]=Math.min(current[j-1]+1,previous[j]+1,previous[j-1]+(a[i-1]===b[j-1]?0:1));}previous=current;}return previous[b.length];};
const suggest=(query,vocabulary)=>{const q=normalize(query);if(!q)return"";const candidates=(vocabulary||[]).map((value,index)=>({value,index,score:distance(q,value)})).filter(x=>x.score===1).sort((a,b)=>a.score-b.score||a.index-b.index);return candidates[0]?.value||"";};
global.VDMText={nfkc,normalize,terms,includesAll,distance,suggest};
})(window);

