(function (global) {
  "use strict";

  const paths = {
    home: '<path d="M3.5 10.5 12 3l8.5 7.5"/><path d="M5.5 9.5V21h13V9.5M9.5 21v-7h5v7"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
    notification: '<path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 6 2.5 7.5h-17C3.5 15 6 15 6 9Z"/><path d="M9.5 20h5"/>',
    bookmark: '<path d="M6 3.5h12v17l-6-3.8-6 3.8Z"/>',
    profile: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
    compose: '<path d="M4 20h4l11-11-4-4L4 16Z"/><path d="m13.5 6.5 4 4M4 4h7"/>',
    reply: '<path d="M9 8 4 12l5 4"/><path d="M5 12h8c4 0 6 2.5 6 6"/>',
    quote: '<path d="M5 7h5v5H6c0 3-1 4-3 5M14 7h5v5h-4c0 3-1 4-3 5"/>',
    repost: '<path d="m7 7 3-3 3 3M10 4v11a4 4 0 0 0 4 4h5"/><path d="m17 16 3 3-3 3"/>',
    like: '<path d="M12 20.5 4.5 13A5 5 0 0 1 12 6.5 5 5 0 0 1 19.5 13Z"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    back: '<path d="m14.5 5-7 7 7 7"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    chat: '<path d="M4 5.5h16v11H9l-5 4Z"/><path d="M8 10h8M8 13h5"/>',
    call: '<path d="M7.5 3.5 11 7 9 10c1.2 2.5 2.5 3.8 5 5l3-2 3.5 3.5-2 3c-.7 1-2 1.4-3.2 1C8.5 18.2 4.8 14.5 2.5 7.7c-.4-1.2 0-2.5 1-3.2Z"/>',
    contacts: '<circle cx="9" cy="8" r="3"/><path d="M3.5 18a5.5 5.5 0 0 1 11 0M16 7h5M18.5 4.5v5"/>',
    attach: '<path d="m8 12 6-6a4 4 0 0 1 5.5 5.5l-8 8a6 6 0 0 1-8.5-8.5l8-8"/><path d="m7 15 8-8"/>',
    send: '<path d="m3 4 18 8-18 8 3-8Z"/><path d="M6 12h15"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m4 18 5-5 3 3 3-3 5 5"/>',
    audio: '<path d="M5 10v4M9 7v10M13 4v16M17 8v8M21 10v4"/>',
    file: '<path d="M6 3h8l4 4v14H6Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    mute: '<path d="M4 10h4l5-4v12l-5-4H4Z"/><path d="m17 10 4 4m0-4-4 4"/>',
    speaker: '<path d="M4 10h4l5-4v12l-5-4H4Z"/><path d="M16 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>',
    caption: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 10a2.5 2.5 0 1 0 0 4M18 10a2.5 2.5 0 1 0 0 4"/>',
    hangup: '<path d="M5 16.5c4.5-3.5 9.5-3.5 14 0"/><path d="m5 16.5-2-3 3-2.5M19 16.5l2-3-3-2.5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>',
    saved: '<path d="M5 4h14v16H5Z"/><path d="M9 4v6l3-2 3 2V4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    pin: '<path d="m8 4 8 8M14 3l7 7-4 1-6 6-1 4-7-7 4-1 6-6Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    play: '<path d="m8 5 11 7-11 7Z"/>',
    missed: '<path d="M6 5h6v6M12 5 5 12"/><path d="m14 14 6 6"/>',
    incoming: '<path d="M18 4v6h-6M18 10 8 20"/>',
    outgoing: '<path d="M6 20v-6h6M6 14 16 4"/>',
    local: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M9 21h6M12 18v3"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    trend: '<path d="m4 17 5-5 4 3 7-8"/><path d="M15 7h5v5"/>',
    verified: '<path d="m12 2 2.2 2.1 3-.1.7 2.9 2.5 1.7-1.2 2.8 1.2 2.8-2.5 1.7-.7 2.9-3-.1L12 22l-2.2-2.1-3 .1-.7-2.9-2.5-1.7 1.2-2.8-1.2-2.8 2.5-1.7.7-2.9 3 .1Z"/><path d="m8.5 12 2.2 2.2 4.8-4.8"/>'
  };

  function icon(name, className) {
    const body = paths[name] || paths.info;
    return '<svg class="ui-icon' + (className ? ' ' + className : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + body + '</svg>';
  }

  global.VDMIcons = { icon, names: Object.freeze(Object.keys(paths)) };
})(window);
