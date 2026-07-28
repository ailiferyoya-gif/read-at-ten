(function () {
  "use strict";
  window.VDM_CONTENT_DATA = {
    schemaVersion: 2, templateVersion: "2.2.0", branding: window.VDM_APP_BRANDING || {},
    search: { records: [], vocabulary: [], discoveredTerms: [], about: "この端末に保存された索引だけを検索します。外部通信は行いません。" },
    social: { viewer: { id: "local-viewer", name: "You", handle: "local" }, accounts: [], posts: [], trends: [], notifications: [] },
    messages: { conversations: [], intents: [], calls: [], contacts: [] },
    mail: { messages: [], folders: ["inbox","sent","drafts","starred","archive","trash"] },
    photos: { items: [], albums: [] }, audio: { items: [], voicemails: [], calls: [] }, files: { items: [], folders: [] }, notes: { items: [] },
    settings: { sound: true, volume: 0.8, reducedMotion: false, textScale: 1, contrast: "normal", hints: true },
    sites: {}, media: { photos: [], audio: [], files: [] }
  };
})();
