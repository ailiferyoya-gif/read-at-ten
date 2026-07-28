(function (global) {
  "use strict";
  const parent = global.parent !== global ? global.parent : global;
  const state = parent.CASE_STATE || global.CASE_STATE;
  const data = global.VDM_CONTENT_DATA || parent.VDM_CONTENT_DATA || {};
  const esc = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const appId = document.body && document.body.dataset.app || "app";
  const brand = (data.branding && data.branding[appId]) || { name: appId, description: "Local application" };
  const read = (path, fallback) => path.split(".").reduce((v, key) => v && v[key], data) ?? fallback;
  const appState = (fallback) => {
    const root = state && state.get ? state.get() : {};
    root.apps = root.apps || {};
    root.apps[appId] = Object.assign({}, fallback || {}, root.apps[appId] || {});
    return root.apps[appId];
  };
  const saveAppState = (next) => {
    if (!state || !state.transact) return;
    state.transact((draft) => {
      draft.apps = draft.apps || {};
      draft.apps[appId] = Object.assign({}, draft.apps[appId] || {}, next || {});
    }, "app-state:" + appId);
  };
  const emit = (name, detail) => {
    const bus = parent.VDM_BUS || global.VDM_BUS;
    if (bus && bus.emit) bus.emit(name, Object.assign({ appId }, detail || {}));
  };
  const openApp = (id, payload) => {
    if (parent.VDM_DESKTOP && parent.VDM_DESKTOP.openApp) parent.VDM_DESKTOP.openApp(id, payload);
    emit("app:open-request", { targetAppId: id, payload: payload || null });
  };
  const frame = (title, subtitle) => {
    document.title = title || brand.name;
    const header = document.querySelector("[data-app-brand]");
    if (header) header.textContent = title || brand.name;
    const sub = document.querySelector("[data-app-description]");
    if (sub) sub.textContent = subtitle || brand.description || "";
  };
  global.VDMApp = { appId, brand, data, state, esc, read, appState, saveAppState, emit, openApp, frame };
})(window);
