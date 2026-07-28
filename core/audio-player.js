(function (global) {
  "use strict";
  let audio;
  const play = (item, hooks) => {
    if (audio) audio.pause(); audio = new Audio(item.src); audio.volume = Number(hooks?.volume ?? 1);
    audio.addEventListener("timeupdate", () => hooks?.onTime?.(audio.currentTime, audio.duration || 0));
    audio.addEventListener("ended", () => hooks?.onEnded?.());
    audio.play(); global.VDMEvidence && global.VDMEvidence.observe(item, "play"); return audio;
  };
  const stop = () => { if (audio) { audio.pause(); audio.currentTime = 0; } };
  global.VDMAudio = { play, stop, current: () => audio };
})(window);
