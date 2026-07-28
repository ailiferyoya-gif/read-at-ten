(function (global) {
  "use strict";
  let dialog;
  const localMediaUrl = (value) => { const url=String(value||""); if (!/^(?:\.\.?\/|data:|blob:|assets\/)/.test(url)) throw new Error("Invalid local media URL"); return url; };
  const ensure = () => {
    if (dialog) return dialog;
    dialog = document.createElement("dialog"); dialog.className = "media-dialog";
    dialog.innerHTML = '<button class="media-close" type="button" aria-label="閉じる">×</button><div data-media-body></div>';
    dialog.querySelector("button").addEventListener("click", () => dialog.close());
    document.body.appendChild(dialog); return dialog;
  };
  const open = (media) => {
    const modal = ensure(), body = modal.querySelector("[data-media-body]"); body.replaceChildren();
    const type = media.type || "image";
    if (type === "image") { const img = new Image(); img.src = localMediaUrl(media.src); img.alt = media.alt || ""; body.appendChild(img); }
    else if (type === "audio") { const audio = document.createElement("audio"); audio.controls = true; audio.src = localMediaUrl(media.src); body.appendChild(audio); }
    else { const pre = document.createElement("pre"); pre.textContent = media.text || media.transcript || "プレビューできません"; body.appendChild(pre); }
    if (media.caption || media.alt) { const p = document.createElement("p"); p.textContent = media.caption || media.alt; body.appendChild(p); }
    modal.showModal(); global.VDMEvidence && global.VDMEvidence.observe(media, "open-media");
  };
  global.localMediaUrl = localMediaUrl; global.VDMMedia = { open };
})(window);
