(function () {
  "use strict";
  const manifest = window.CASE_MANIFEST || {};
  const caseSlug = manifest.caseSlug || "virtual-desktop-case";
  const gameVersion = manifest.version || "0.1.0";
  const schemaVersion = 1;
  const storageKey = `${caseSlug}-save-v${schemaVersion}`;
  let memoryState = null;
  function localBlobUrl(blob) { return URL.createObjectURL(blob); }

  function checksum(value) {
    if (!window.VDMCrypto || typeof window.VDMCrypto.sha256Sync !== "function") throw new Error("sha256-unavailable");
    return window.VDMCrypto.sha256Sync(JSON.stringify(value));
  }

  function readLocal() {
    try { return JSON.parse(localStorage.getItem(storageKey) || "null"); } catch (_) { return null; }
  }

  function writeLocal(value) {
    try { localStorage.setItem(storageKey, JSON.stringify(value)); return true; } catch (_) { return false; }
  }

  window.SaveAdapter = {
    load() { return readLocal() || memoryState; },
    save(state) {
      memoryState = state;
      const saved = writeLocal(state);
      if (!saved) window.dispatchEvent(new CustomEvent("save-adapter-warning", { detail: "自動保存を利用できません。必要に応じてセーブを書き出してください。" }));
      return saved;
    },
    reset() {
      memoryState = null;
      try { localStorage.removeItem(storageKey); } catch (_) {}
    },
    exportSave() {
      const gameState = this.load();
      const payload = { caseSlug, gameVersion, schemaVersion, savedAt: new Date().toISOString(), gameState };
      payload.checksum = checksum(payload);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = localBlobUrl(blob);
      const url = link.href;
      link.download = `${caseSlug}-save-v${schemaVersion}.json`;
      link.hidden = true;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    async importSave(file) {
      const payload = JSON.parse(await file.text());
      const supplied = payload.checksum;
      delete payload.checksum;
      if (payload.caseSlug !== caseSlug) throw new Error("different-case");
      if (payload.schemaVersion !== schemaVersion) throw new Error("unsupported-save-schema");
      if (checksum(payload) !== supplied) throw new Error("damaged-save");
      this.save(payload.gameState);
      return payload.gameState;
    },
    migrate(payload) { return payload; },
    diagnostics() {
      return {
        gameVersion,
        schemaVersion,
        browserFamily: navigator.userAgentData ? navigator.userAgentData.brands[0].brand : "browser",
        currentGamePhase: "local-investigation",
        saveAvailable: Boolean(this.load()),
        audioEnabled: true,
        reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
        lastInternalErrorCode: null,
        externalCommunication: false
      };
    }
  };
})();
