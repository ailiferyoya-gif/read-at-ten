(function () {
  "use strict";
  const listeners = new Map();
  window.VDM_BUS = {
    on(type, handler) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(handler); return () => listeners.get(type).delete(handler); },
    emit(type, detail) { const event = { type, detail: detail || {}, at: new Date().toISOString() }; (listeners.get(type) || []).forEach((handler) => handler(event)); window.dispatchEvent(new CustomEvent("vdm:" + type, { detail: event.detail })); return event; }
  };
}());
