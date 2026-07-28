(function(global){
"use strict";
const parentWindow=global.parent===global?global:global.parent;
const text=global.VDMText;
const engine={
 normalize:value=>text.normalize(value),
 matches:(query,aliases)=>text.includesAll((aliases||[]).join(" "),query),
 suggest:(query,vocabulary)=>text.suggest(query,vocabulary),
 emit(type,detail){return parentWindow.VDM_BUS?.emit(type,detail)??null;},
 observe(evidenceId,medium,payload){if(evidenceId)parentWindow.CASE_STATE?.observe(evidenceId,medium,payload);}
};
global.VDMContentEngine=engine;
global.VDM_CONTENT=engine;
})(window);

